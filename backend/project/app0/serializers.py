from rest_framework import serializers
from .models import (
    CPU, Motherboard,
    Cooler, Ram, Storage, Gpu, Psu, Case, BuildSession, PrebuiltPC
)

class CPUSerializer(serializers.ModelSerializer):
    class Meta:
        model = CPU
        fields = ('id', 'platform', 'wattage', 'name', 'price', 'description', 'image', 'socket')

class MotherboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motherboard
        fields = ('id', 'platform', 'wattage', 'name', 'price', 'description', 'image', 'socket', 'ram_type', 'form_factor')
    
class CoolerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cooler
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class RamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ram
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image', 'ram_type')

class StorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Storage
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class GpuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gpu
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class PsuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Psu
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ('id', 'wattage', 'name', 'price', 'description', 'image')

class BuildSessionSerializer(serializers.ModelSerializer):
    estimated_watts = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()
    is_compatible = serializers.SerializerMethodField()
    compatibility_notes = serializers.SerializerMethodField()

    cpu = CPUSerializer(read_only=True)
    motherboard = MotherboardSerializer(read_only=True)
    cooler = CoolerSerializer(read_only=True)
    ram = RamSerializer(read_only=True)
    storage = StorageSerializer(read_only=True)
    gpu = GpuSerializer(read_only=True)
    psu = PsuSerializer(read_only=True)
    case = CaseSerializer(read_only=True)
    
    user = serializers.SerializerMethodField()

    class Meta:
        model = BuildSession
        exclude = ('session_secret',)

    def get_user(self, obj):
        if obj.user:
            return {"id": obj.user.id, "username": obj.user.username, "first_name": obj.user.first_name, "last_name": obj.user.last_name}
        return None

    def get_compatibility_notes(self, obj):
        from .builder.compatibility import CompatibilityEngine
        return CompatibilityEngine.get_validation_errors(obj)

    def get_is_compatible(self, obj):
        return len(self.get_compatibility_notes(obj)) == 0

class PrebuiltPCSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()
    
    # return id and name of components
    cpu_name = serializers.CharField(source='cpu.name', read_only=True)
    motherboard_name = serializers.CharField(source='motherboard.name', read_only=True)
    gpu_name = serializers.CharField(source='gpu.name', read_only=True)
    ram_name = serializers.CharField(source='ram.name', read_only=True)

    class Meta:
        model = PrebuiltPC
        fields = '__all__'
        depth = 1
