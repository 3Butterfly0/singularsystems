from django.shortcuts import render
from .serializers import contact_usSerializer
from .models import contact_us
from rest_framework import viewsets, permissions

class IsAdminUserOrCreateOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        return request.user and request.user.is_staff

class contact_usView(viewsets.ModelViewSet):
    serializer_class = contact_usSerializer
    queryset = contact_us.objects.all()
    permission_classes = [IsAdminUserOrCreateOnly]