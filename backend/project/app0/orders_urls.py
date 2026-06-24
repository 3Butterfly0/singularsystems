from django.urls import path
from .orders_views import PlaceOrderView, OrderDetailView, OrderListView, MarkPaidView

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('place/', PlaceOrderView.as_view(), name='order-place'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:pk>/mark-paid/', MarkPaidView.as_view(), name='order-mark-paid'),
]
