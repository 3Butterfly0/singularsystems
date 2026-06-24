from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignUpView,
    MeView,
    AddressListCreateView,
    AddressDetailView,
    AddressSetDefaultView,
)

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='accounts-me'),
    path('addresses/', AddressListCreateView.as_view(), name='addresses'),
    path('addresses/<uuid:pk>/', AddressDetailView.as_view(), name='address-detail'),
    path('addresses/<uuid:pk>/set-default/', AddressSetDefaultView.as_view(), name='address-set-default'),
]