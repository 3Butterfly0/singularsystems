from rest_framework import status, views, generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.contenttypes.models import ContentType
from app0.models import (
    BuildSession,
    CPU,
    Motherboard,
    Ram,
    Gpu,
    Psu,
    Case,
    Storage,
    Cooler,
    Order,
    PrebuiltPC,
    OrderItem,
)
from app0.serializers import BuildSessionSerializer, PrebuiltPCSerializer
from .compatibility import CompatibilityEngine
from django.utils import timezone
from datetime import timedelta
import secrets


def check_session_auth(request, session):
    if request.user.is_authenticated and session.user == request.user:
        return True
        
    if session.user is None and session.session_expires_at and session.session_expires_at < timezone.now():
        return False
        
    secret = request.headers.get("X-BUILD-SESSION-SECRET") or request.META.get(
        "HTTP_X_BUILD_SESSION_SECRET"
    )
    if (
        secret
        and session.session_secret
        and check_password(secret, session.session_secret)
    ):
        return True
    return False


class BuildSessionCreateView(views.APIView):
    def post(self, request):
        platform = request.data.get("platform", None)  # 'intel' or 'amd'
        raw_secret = secrets.token_urlsafe(32)
        hashed_secret = make_password(raw_secret)

        session = BuildSession(platform=platform, session_secret=hashed_secret)
        if request.user.is_authenticated:
            session.user = request.user
        else:
            session.session_expires_at = timezone.now() + timedelta(days=7)
        session.save()

        data = BuildSessionSerializer(session).data
        data["session_secret"] = raw_secret  # Return plain text only once to client
        return Response(data, status=status.HTTP_201_CREATED)

    def get(self, request):
        # Return all active sessions for a user, or error if unauthenticated
        if request.user.is_authenticated:
            sessions = BuildSession.objects.filter(user=request.user)
            serializer = BuildSessionSerializer(sessions, many=True)
            return Response(serializer.data)
        return Response(
            {"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED
        )


class BuildSessionDetailView(views.APIView):
    def get(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(BuildSessionSerializer(session).data)

from rest_framework.permissions import IsAuthenticated

class BuildSessionClaimView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        
        if session.user == request.user:
            return Response({"detail": "Session already claimed by you."}, status=status.HTTP_200_OK)
            
        if session.user is not None:
            return Response({"error": "Session belongs to another user."}, status=status.HTTP_400_BAD_REQUEST)
            
        secret = request.headers.get("X-BUILD-SESSION-SECRET") or request.META.get("HTTP_X_BUILD_SESSION_SECRET")
        if not secret or not session.session_secret or not check_password(secret, session.session_secret):
            return Response({"error": "Invalid or missing session secret."}, status=status.HTTP_403_FORBIDDEN)
            
        session.user = request.user
        raw_secret = secrets.token_urlsafe(32)
        session.session_secret = make_password(raw_secret)
        session.session_expires_at = None
        session.save()
        
        data = BuildSessionSerializer(session).data
        data["session_secret"] = raw_secret
        return Response(data, status=status.HTTP_200_OK)


class PrebuiltPCDetailView(generics.RetrieveAPIView):
    queryset = PrebuiltPC.objects.all()
    serializer_class = PrebuiltPCSerializer
    permission_classes = [AllowAny]


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class BuildSessionOptionsView(views.APIView):
    def get(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        component_type = request.query_params.get("type")
        if not component_type:
            return Response(
                {"error": "type query param is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = None
        if component_type == "cpu":
            qs = CompatibilityEngine.get_compatible_cpus(session)
        elif component_type == "motherboard":
            qs = CompatibilityEngine.get_compatible_motherboards(session)
        elif component_type == "ram":
            qs = CompatibilityEngine.get_compatible_ram(session)
        elif component_type == "psu":
            qs = CompatibilityEngine.get_compatible_psus(session)
        elif component_type == "case":
            qs = CompatibilityEngine.get_compatible_cases(session)
        elif component_type in ["gpu", "storage", "cooler"]:
            models_map = {
                "gpu": Gpu,
                "storage": Storage,
                "cooler": Cooler,
            }
            qs = models_map[component_type].objects.all()
        else:
            return Response(
                {"error": "invalid component type"}, status=status.HTTP_400_BAD_REQUEST
            )

        qs = qs.order_by('price')
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request, view=self)

        # Placeholder for AI recommendations (Phase 5)
        recs = [{"item": item, "is_recommended": False} for item in page]

        options = []
        for r in recs:
            item = r["item"]
            
            brand = item.__class__.__name__.replace("intel", "Intel ").replace("amd", "AMD ").title()
            if component_type in ["cpu", "motherboard"]:
                brand = "Intel " if getattr(item, "platform", "") == "intel" else "AMD "
                
            type_label = component_type.upper() if component_type in ["cpu", "gpu"] else component_type.title()

            options.append({
                "id": item.id,
                "name": item.name,
                "price": item.price,
                "type": type_label,
                "is_recommended": r["is_recommended"],
                "image": (
                    request.build_absolute_uri(item.image.url)
                    if item.image
                    else None
                ),
                "brand": brand,
            })

        # sort options so that recommended items are at the top
        options.sort(key=lambda x: x.get("is_recommended", False), reverse=True)
        return paginator.get_paginated_response(options)



class PrebuiltPCListView(views.APIView):
    def get(self, request):
        category = request.query_params.get("category")
        qs = PrebuiltPC.objects.all()
        if category:
            qs = qs.filter(category=category)

        serializer = PrebuiltPCSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class BuildSessionSelectionView(views.APIView):
    def patch(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        comp_type = request.data.get("component_type")
        comp_id = request.data.get("component_id")
        action = request.data.get("action", "add")
        platform = request.data.get("platform")

        if platform:
            if platform in ["intel", "amd"]:
                session.platform = platform
                purpose = request.data.get("purpose")
                if purpose:
                    session.purpose = purpose
                session.save()
                return Response(BuildSessionSerializer(session).data)
            return Response(
                {"error": "Invalid platform"}, status=status.HTTP_400_BAD_REQUEST
            )

        models_map = {
            "cpu": (CPU, "cpu"),
            "motherboard": (Motherboard, "motherboard"),
            "ram": (Ram, "ram"),
            "gpu": (Gpu, "gpu"),
            "psu": (Psu, "psu"),
            "case": (Case, "case"),
            "storage": (Storage, "storage"),
            "cooler": (Cooler, "cooler"),
        }

        if comp_type not in models_map:
            return Response(
                {"error": "Invalid component type"}, status=status.HTTP_400_BAD_REQUEST
            )

        ModelClass, field_name = models_map[comp_type]

        if action == "remove":
            setattr(session, field_name, None)
            session.save()
            return Response(BuildSessionSerializer(session).data)

        if action == "add":
            comp = get_object_or_404(ModelClass, pk=comp_id)
            setattr(session, field_name, comp)

            # Cascade Clearing: If a foundational part is changed, clear downstream for safety
            if comp_type == "cpu":
                session.motherboard = None
                session.ram = None
                session.platform = comp.platform

            elif comp_type == "motherboard":
                session.ram = None
                session.platform = comp.platform

            session.save()

            # clear downstream components if they become incompatible
            errors = CompatibilityEngine.get_validation_errors(session)
            if errors:
                changed = False
                for err in errors:
                    if "Incompatible Socket" in err:
                        if comp_type == "cpu":
                            session.motherboard = None
                        else:
                            session.cpu = None
                        changed = True

                    if "Incompatible RAM" in err:
                        if comp_type == "ram":
                            session.motherboard = None
                        else:
                            session.ram = None
                        changed = True

                    if "Insufficient Power" in err:
                        if comp_type != "psu":
                            session.psu = None
                            changed = True

                if changed:
                    session.save()

            return Response(BuildSessionSerializer(session).data)

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class BuildSessionValidateView(views.APIView):
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        errors = CompatibilityEngine.get_validation_errors(session)
        is_valid = len(errors) == 0
        return Response({"valid": is_valid, "errors": errors})


from rest_framework.permissions import IsAuthenticated

class BuildSessionProceedToBuyView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required to buy"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if session.status == 'ordered':
            return Response(
                {'detail': 'This build has already been ordered.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not session.user:
            session.user = request.user
            session.save()

        errors = CompatibilityEngine.get_validation_errors(session)
        if errors:
            return Response(
                {
                    "error": "Cannot proceed to buy with incompatible components.",
                    "validation_errors": errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # components list
        components = [
            session.cpu,
            session.motherboard,
            session.ram,
            session.gpu,
            session.psu,
            session.storage,
            session.cooler,
            session.case,
        ]
        components = [c for c in components if c is not None]

        try:
            with transaction.atomic():
                out_of_stock = []
                locked_comps = []

                # Sort components to prevent deadlocks
                components.sort(key=lambda c: (c.__class__.__name__, str(c.id)))

                for comp in components:
                    # Lock row
                    locked_comp = comp.__class__.objects.select_for_update().get(
                        pk=comp.pk
                    )
                    locked_comps.append(locked_comp)
                    if locked_comp.stock <= 0:
                        out_of_stock.append(locked_comp.name)

                if out_of_stock:
                    return Response(
                        {
                            "error": "Some components are out of stock.",
                            "out_of_stock_items": out_of_stock,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Deduct stock
                for comp in locked_comps:
                    comp.stock -= 1
                    comp.save()

                shipping_address = request.user.addresses.filter(is_default=True).first()
                if not shipping_address:
                    return Response(
                        {'detail': 'Please add a shipping address to your profile before placing an order.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create or retrieve existing Order for this session
                order, created = Order.objects.get_or_create(
                    build_session=session,
                    defaults={
                        "user": request.user,
                        "total_price": session.total_price,
                        "status": "pending",
                        "shipping_address": shipping_address,
                    },
                )

                if not created:
                    return Response({'detail': 'Order already placed.'}, status=400)
                    
                if created:
                    for comp in locked_comps:
                        content_type = ContentType.objects.get_for_model(comp)
                        OrderItem.objects.create(
                            order=order,
                            component_type=content_type,
                            component_id=comp.id,
                            price_at_purchase=comp.price
                        )

                session.status = "ordered"
                session.save()

            return Response(
                {
                    "success": True,
                    "status": session.status,
                    "order_id": order.id,
                    "message": "Order successfully placed.",
                }
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BuildSessionLoadBuildView(views.APIView):
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        data = request.data
        platform = data.get("platform")
        if platform:
            if platform in ["intel", "amd"]:
                session.platform = platform
            else:
                return Response(
                    {"error": "Invalid platform"}, status=status.HTTP_400_BAD_REQUEST
                )

        # Reset current parts for a clean load
        session.cpu = None
        session.motherboard = None
        session.ram = None
        session.gpu = None
        session.psu = None
        session.storage = None
        session.cooler = None
        session.case = None

        try:
            if data.get("cpu_id"):
                session.cpu = CPU.objects.get(pk=data.get("cpu_id"))
            if data.get("motherboard_id"):
                session.motherboard = Motherboard.objects.get(
                    pk=data.get("motherboard_id")
                )

            if data.get("gpu_id"):
                session.gpu = Gpu.objects.get(pk=data.get("gpu_id"))
            if data.get("ram_id"):
                session.ram = Ram.objects.get(pk=data.get("ram_id"))
            if data.get("psu_id"):
                session.psu = Psu.objects.get(pk=data.get("psu_id"))
            if data.get("storage_id"):
                session.storage = Storage.objects.get(pk=data.get("storage_id"))
            if data.get("cooler_id"):
                session.cooler = Cooler.objects.get(pk=data.get("cooler_id"))
            if data.get("case_id"):
                session.case = Case.objects.get(pk=data.get("case_id"))

            from .compatibility import CompatibilityEngine
            errors = CompatibilityEngine.get_validation_errors(session)
            if errors:
                return Response({'compatibility_errors': errors}, status=status.HTTP_400_BAD_REQUEST)

            session.save()
            return Response(BuildSessionSerializer(session).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
