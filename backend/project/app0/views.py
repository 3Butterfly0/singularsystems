from django.shortcuts import render
from .serializers import CPUSerializer, MotherboardSerializer, CoolerSerializer, RamSerializer, StorageSerializer, GpuSerializer, PsuSerializer, CaseSerializer
from rest_framework import viewsets, permissions
from .models import CPU, Motherboard, Cooler, Ram, Storage, Gpu, Psu, Case

class IsAdminUserOrReadOnly(permissions.IsAdminUser):
    def has_permission(self, request, view):
        is_admin = super().has_permission(request, view)
        return request.method in permissions.SAFE_METHODS or is_admin

class CPUView(viewsets.ModelViewSet):
    serializer_class = CPUSerializer
    queryset = CPU.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class MotherboardView(viewsets.ModelViewSet):
    serializer_class = MotherboardSerializer
    queryset = Motherboard.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class CoolerView(viewsets.ModelViewSet):
    serializer_class = CoolerSerializer
    queryset = Cooler.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class RamView(viewsets.ModelViewSet):
    serializer_class = RamSerializer
    queryset = Ram.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class StorageView(viewsets.ModelViewSet):
    serializer_class = StorageSerializer
    queryset = Storage.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class GpuView(viewsets.ModelViewSet):
    serializer_class = GpuSerializer
    queryset = Gpu.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class PsuView(viewsets.ModelViewSet):
    serializer_class = PsuSerializer
    queryset = Psu.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]

class CaseView(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    queryset = Case.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]