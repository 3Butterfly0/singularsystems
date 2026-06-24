from django.urls import path
from . import cart_views

urlpatterns = [
    path('', cart_views.CartDetailView.as_view(), name='cart-detail'),
    path('items/', cart_views.CartItemCreateView.as_view(), name='cart-item-create'),
    path('items/<uuid:pk>/', cart_views.CartItemDeleteView.as_view(), name='cart-item-delete'),
    path('reprice/', cart_views.CartRepriceView.as_view(), name='cart-reprice'),
    path('claim-guest/', cart_views.ClaimGuestView.as_view(), name='cart-claim-guest'),
]
