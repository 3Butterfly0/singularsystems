from rest_framework import serializers
from .models import intelCPU, intelMotherboard, amdCPU, amdMotherboard, cooler, ram, storage, gpu, psu, case

class intelCPUSerializer(serializers.ModelSerializer):
    class Meta:
        model = intelCPU
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class intelMotherboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = intelMotherboard
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class amdCPUSerializer(serializers.ModelSerializer):
    class Meta:
        model = amdCPU
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')
    
class amdMotherboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = amdMotherboard
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')
    
class coolerSerializer(serializers.ModelSerializer):
    class Meta:
        model = cooler
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class ramSerializer(serializers.ModelSerializer):
    class Meta:
        model = ram
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class storageSerializer(serializers.ModelSerializer):
    class Meta:
        model = storage
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class gpuSerializer(serializers.ModelSerializer):
    class Meta:
        model = gpu
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class psuSerializer(serializers.ModelSerializer):
    class Meta:
        model = psu
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class caseSerializer(serializers.ModelSerializer):
    class Meta:
        model = case
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

from .models import BuildSession

class BuildSessionSerializer(serializers.ModelSerializer):
    estimated_watts = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = BuildSession
        exclude = ('session_secret',)