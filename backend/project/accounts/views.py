from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app0.models import UserAddress
from .serializers import UserSerializer, UserProfileSerializer, UserAddressSerializer

User = get_user_model()


class SignUpView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class MeView(views.APIView):
    """GET /api/accounts/me/ — safe profile for the logged-in user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class AddressListCreateView(views.APIView):
    """
    GET  /api/accounts/addresses/ — list this user's addresses
    POST /api/accounts/addresses/ — create a new address
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = UserAddress.objects.filter(user=request.user).order_by('-is_default', '-created_at')
        return Response(UserAddressSerializer(qs, many=True).data)

    def post(self, request):
        serializer = UserAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # If this is marked default, unset all other defaults first
        if serializer.validated_data.get('is_default'):
            UserAddress.objects.filter(user=request.user).update(is_default=False)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AddressDetailView(views.APIView):
    """
    GET    /api/accounts/addresses/<id>/  — retrieve
    PATCH  /api/accounts/addresses/<id>/  — partial update
    DELETE /api/accounts/addresses/<id>/  — delete
    """
    permission_classes = [IsAuthenticated]

    def _get_address(self, pk, user):
        try:
            return UserAddress.objects.get(pk=pk, user=user)
        except UserAddress.DoesNotExist:
            return None

    def get(self, request, pk):
        addr = self._get_address(pk, request.user)
        if not addr:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserAddressSerializer(addr).data)

    def patch(self, request, pk):
        addr = self._get_address(pk, request.user)
        if not addr:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserAddressSerializer(addr, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('is_default'):
            UserAddress.objects.filter(user=request.user).update(is_default=False)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        addr = self._get_address(pk, request.user)
        if not addr:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        addr.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddressSetDefaultView(views.APIView):
    """POST /api/accounts/addresses/<id>/set-default/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            addr = UserAddress.objects.get(pk=pk, user=request.user)
        except UserAddress.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        with transaction.atomic():
            UserAddress.objects.filter(user=request.user).update(is_default=False)
            addr.is_default = True
            addr.save(update_fields=['is_default'])
        return Response(UserAddressSerializer(addr).data)
