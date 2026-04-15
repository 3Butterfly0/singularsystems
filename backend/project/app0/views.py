from django.shortcuts import render
from .serializers import intelCPUSerializer, intelMotherboardSerializer, amdCPUSerializer, amdMotherboardSerializer, coolerSerializer, ramSerializer, storageSerializer, gpuSerializer, psuSerializer, caseSerializer
from rest_framework import viewsets  
from .models import intelCPU, intelMotherboard, amdCPU, amdMotherboard, cooler, ram, storage, gpu, psu, case

class intelCPUView(viewsets.ModelViewSet):
    serializer_class = intelCPUSerializer
    queryset = intelCPU.objects.all()

class intelMotherboardView(viewsets.ModelViewSet):
    serializer_class = intelMotherboardSerializer
    queryset = intelMotherboard.objects.all()

class amdCPUView(viewsets.ModelViewSet):
    serializer_class = amdCPUSerializer
    queryset = amdCPU.objects.all()

class amdMotherboardView(viewsets.ModelViewSet):
    serializer_class = amdMotherboardSerializer
    queryset = amdMotherboard.objects.all()

class coolerView(viewsets.ModelViewSet):
    serializer_class = coolerSerializer
    queryset = cooler.objects.all()

class ramView(viewsets.ModelViewSet):
    serializer_class = ramSerializer
    queryset = ram.objects.all()

class storageView(viewsets.ModelViewSet):
    serializer_class = storageSerializer
    queryset = storage.objects.all()

class gpuView(viewsets.ModelViewSet):
    serializer_class = gpuSerializer
    queryset = gpu.objects.all()

class psuView(viewsets.ModelViewSet):
    serializer_class = psuSerializer
    queryset = psu.objects.all()

class caseView(viewsets.ModelViewSet):
    serializer_class = caseSerializer
    queryset = case.objects.all()