"""
app0/orders_views.py — Checkout, Order placement, and Order retrieval.

Two-step checkout flow:
  Step 1: POST /api/builder/session/<id>/proceed/  → validates build, sets status='ready_to_buy'
  Step 2: POST /api/orders/place/                  → atomic order creation (this file)
"""
import uuid as uuid_lib

from django.db import transaction
from django.db.models import F
from rest_framework import status, views
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from app0.models import (
    BuildSession, Order, OrderItem, UserAddress,
    CPU, Motherboard, Ram, Gpu, Psu, Case, Storage, Cooler,
)

ASSEMBLY_CHARGE = 350   # ₹
TAX_RATE = 0.08         # 8%

COMPONENT_FIELDS = [
    ('cpu', CPU),
    ('motherboard', Motherboard),
    ('ram', Ram),
    ('gpu', Gpu),
    ('psu', Psu),
    ('cooler', Cooler),
    ('storage', Storage),
    ('case', Case),
]


def _calculate_order_total(components_total: int) -> dict:
    assembly = ASSEMBLY_CHARGE
    tax = int((components_total + assembly) * TAX_RATE)
    return {
        'components_total': components_total,
        'assembly_charge': assembly,
        'tax': tax,
        'total': components_total + assembly + tax,
    }


class PlaceOrderView(views.APIView):
    """
    POST /api/orders/place/
    Step 2 of checkout. Atomically:
      - Validates session is ready_to_buy and owned by the requesting user
      - Validates a shipping address exists and belongs to the user
      - Locks all component rows (select_for_update, sorted IDs to prevent deadlocks)
      - Rechecks stock for every component
      - Recalculates server-side total (components + assembly + tax)
      - Creates Order + OrderItem rows
      - Decrements stock atomically
      - Sets session.status = 'ordered'
    Idempotent: duplicate idempotency_key returns the existing Order.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        address_id = request.data.get('address_id')
        idempotency_key = request.data.get('idempotency_key') or str(uuid_lib.uuid4())

        # --- Pre-flight checks (outside the transaction) ---
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = BuildSession.objects.select_related(
                'cpu', 'motherboard', 'ram', 'gpu', 'psu', 'cooler', 'storage', 'case'
            ).get(pk=session_id, user=request.user)
        except BuildSession.DoesNotExist:
            return Response({'error': 'Build session not found'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'ready_to_buy':
            return Response(
                {'error': 'Build must be in ready_to_buy status. Call /proceed/ first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not address_id:
            return Response({'error': 'ADDRESS_REQUIRED'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            address = UserAddress.objects.get(pk=address_id, user=request.user)
        except UserAddress.DoesNotExist:
            return Response({'error': 'ADDRESS_REQUIRED'}, status=status.HTTP_404_NOT_FOUND)

        # Idempotency: return existing order if key already used
        existing = Order.objects.filter(
            user=request.user,
            build_session=session,
        ).first()
        if existing and existing.status != 'pending':
            return Response({'order_id': str(existing.id), 'idempotent': True})

        # --- Collect component references ---
        selected_components = []   # [(component_type, component_instance), ...]
        for field, Model in COMPONENT_FIELDS:
            comp = getattr(session, field, None)
            if comp:
                selected_components.append((field, comp))

        if not selected_components:
            return Response({'error': 'No components selected in this build'}, status=status.HTTP_400_BAD_REQUEST)

        # Sort IDs alphanumerically to guarantee consistent lock order and prevent deadlocks
        sorted_components = sorted(selected_components, key=lambda x: str(x[1].pk))

        # --- Atomic transaction ---
        try:
            with transaction.atomic():
                # Lock all component rows
                locked_ids_by_type = {}
                for field, comp in sorted_components:
                    Model = type(comp)
                    locked = Model.objects.select_for_update().get(pk=comp.pk)
                    locked_ids_by_type[field] = locked

                # Recheck stock
                out_of_stock = [
                    f"{field} ({comp.name})"
                    for field, comp in locked_ids_by_type.items()
                    if comp.stock <= 0
                ]
                if out_of_stock:
                    return Response(
                        {
                            'error': 'INSUFFICIENT_STOCK',
                            'out_of_stock': out_of_stock,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Recalculate total server-side
                components_total = sum(comp.price for comp in locked_ids_by_type.values())
                pricing = _calculate_order_total(components_total)

                # Snapshot shipping address to JSON (immutable after order)
                address_snapshot = {
                    'address_line1': address.address_line1,
                    'address_line2': address.address_line2 or '',
                    'city': address.city,
                    'state': address.state,
                    'postal_code': address.postal_code,
                    'country': address.country,
                }

                # Create Order
                order = Order.objects.create(
                    user=request.user,
                    build_session=session,
                    shipping_address=address,
                    total_price=pricing['total'],
                    status='pending',
                    payment_status='pending',
                )

                # Create OrderItems (price snapshot)
                for field, comp in locked_ids_by_type.items():
                    OrderItem.objects.create(
                        order=order,
                        component_type=field,
                        component_id=str(comp.pk),
                        price_at_purchase=comp.price,
                    )

                # Decrement stock atomically
                for field, comp in locked_ids_by_type.items():
                    type(comp).objects.filter(pk=comp.pk).update(stock=F('stock') - 1)

                # Mark session as ordered
                session.status = 'ordered'
                session.save(update_fields=['status'])

        except Exception as exc:
            return Response(
                {'error': 'Order creation failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'order_id': str(order.id),
                'total': pricing['total'],
                'components_total': pricing['components_total'],
                'assembly_charge': pricing['assembly_charge'],
                'tax': pricing['tax'],
                'status': order.status,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderDetailView(views.APIView):
    """GET /api/orders/<id>/ — retrieve a single order (owner only)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items').get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        items = [
            {
                'component_type': item.component_type,
                'component_id': item.component_id,
                'price_at_purchase': item.price_at_purchase,
            }
            for item in order.items.all()
        ]
        return Response({
            'id': str(order.id),
            'status': order.status,
            'payment_status': order.payment_status,
            'total_price': order.total_price,
            'created_at': order.created_at.isoformat(),
            'items': items,
        })


class OrderListView(views.APIView):
    """GET /api/orders/ — order history for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        data = [
            {
                'id': str(o.id),
                'status': o.status,
                'payment_status': o.payment_status,
                'total_price': o.total_price,
                'created_at': o.created_at.isoformat(),
            }
            for o in orders
        ]
        return Response(data)


class MarkPaidView(views.APIView):
    """
    POST /api/orders/<id>/mark-paid/
    Staff-only manual payment confirmation (stub until Razorpay integration).
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        order.payment_status = 'paid'
        order.status = 'confirmed'
        order.save(update_fields=['payment_status', 'status'])
        return Response({'order_id': str(order.id), 'payment_status': order.payment_status, 'status': order.status})
