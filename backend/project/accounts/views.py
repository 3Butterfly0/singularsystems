from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .serializers import UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.throttling import ScopedRateThrottle

class SignUpView(generics.CreateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'signup'

from rest_framework.permissions import IsAuthenticated

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            if access_token:
                response.set_cookie(
                    'access_token',
                    access_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax'
                )
            if refresh_token:
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax'
                )
            # Remove tokens from JSON body
            response.data.pop('access', None)
            response.data.pop('refresh', None)
        return response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Refresh token is typically in cookies
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            request.data['refresh'] = refresh_token
        
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            if access_token:
                response.set_cookie(
                    'access_token',
                    access_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax'
                )
            # Remove tokens from JSON body
            response.data.pop('access', None)
            response.data.pop('refresh', None)
        return response

class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response
