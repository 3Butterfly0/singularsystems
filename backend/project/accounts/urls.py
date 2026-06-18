from django.urls import path
from .views import SignUpView, CustomTokenObtainPairView, CustomTokenRefreshView, LogoutView, CurrentUserView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='token_blacklist'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
]