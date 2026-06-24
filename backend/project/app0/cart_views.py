from rest_framework import status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, BuildSession, PrebuiltPC
from .serializers import CartSerializer, CartItemSerializer
import uuid

def get_or_create_cart(request):
    """
    Helper to get the current user's or guest's cart.
    Creates a cart if it doesn't exist.
    """
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart
    
    guest_token = request.headers.get("X-GUEST-TOKEN")
    if not guest_token:
        # If no token provided, generate one, but it should ideally come from frontend.
        guest_token = str(uuid.uuid4())
    
    cart, _ = Cart.objects.get_or_create(user=None, guest_token=guest_token)
    return cart

class CartDetailView(views.APIView):
    def get(self, request):
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartItemCreateView(views.APIView):
    def post(self, request):
        cart = get_or_create_cart(request)
        item_type = request.data.get('item_type') # 'custom_build' or 'prebuilt'
        
        if item_type == 'custom_build':
            session_id = request.data.get('build_session_id')
            session = get_object_or_404(BuildSession, id=session_id)
            price = session.total_price
            item = CartItem.objects.create(
                cart=cart, 
                item_type=item_type, 
                build_session=session, 
                price_at_add=price
            )
        elif item_type == 'prebuilt':
            prebuilt_id = request.data.get('prebuilt_id')
            prebuilt = get_object_or_404(PrebuiltPC, id=prebuilt_id)
            price = prebuilt.total_price
            item = CartItem.objects.create(
                cart=cart, 
                item_type=item_type, 
                prebuilt=prebuilt, 
                price_at_add=price
            )
        else:
            return Response({"error": "Invalid item_type"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CartItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CartItemDeleteView(views.APIView):
    def delete(self, request, pk):
        cart = get_or_create_cart(request)
        item = get_object_or_404(CartItem, id=pk, cart=cart)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CartRepriceView(views.APIView):
    def post(self, request):
        cart = get_or_create_cart(request)
        for item in cart.items.all():
            if item.item_type == 'custom_build' and item.build_session:
                item.price_at_add = item.build_session.total_price
                item.save(update_fields=['price_at_add'])
            elif item.item_type == 'prebuilt' and item.prebuilt:
                item.price_at_add = item.prebuilt.total_price
                item.save(update_fields=['price_at_add'])
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class ClaimGuestView(views.APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        guest_token = request.data.get('guest_token') or request.headers.get('X-GUEST-TOKEN')
        if not guest_token:
            return Response({"error": "No guest token provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = request.user
        
        # 1. Claim guest builds that haven't been claimed yet
        # If the frontend stores session secrets locally, it should pass them, but here we can just claim any session created by this guest cart
        guest_cart = Cart.objects.filter(user=None, guest_token=guest_token).first()
        if not guest_cart:
            return Response({"detail": "No guest data found for this token"}, status=status.HTTP_200_OK)
            
        # 3. Find or create the user's main cart
        user_cart, _ = Cart.objects.get_or_create(user=user)
        
        # 4. Merge guest cart into user cart
        for item in guest_cart.items.all():
            # Deduplicate logic
            exists = False
            if item.item_type == 'custom_build' and item.build_session:
                exists = user_cart.items.filter(item_type='custom_build', build_session=item.build_session).exists()
                # Also assign the build session to the user
                item.build_session.user = user
                item.build_session.save(update_fields=['user'])
            elif item.item_type == 'prebuilt' and item.prebuilt:
                exists = user_cart.items.filter(item_type='prebuilt', prebuilt=item.prebuilt).exists()
                
            if exists:
                # Deduplicate: remove identical item
                item.delete()
            else:
                # Move to user cart and reprice
                item.cart = user_cart
                if item.item_type == 'custom_build' and item.build_session:
                    item.price_at_add = item.build_session.total_price
                elif item.item_type == 'prebuilt' and item.prebuilt:
                    item.price_at_add = item.prebuilt.total_price
                item.save(update_fields=['cart', 'price_at_add'])
                
        # 5. Clear guest credentials
        guest_cart.delete()
        
        return Response({"success": True, "message": "Guest data claimed and merged successfully"})
