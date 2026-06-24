from django.contrib.auth import get_user_model
from rest_framework import serializers
from app0.models import UserAddress

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """Safe read-only profile. Never exposes password."""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff')
        read_only_fields = fields


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = (
            'id', 'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country', 'is_default', 'created_at',
        )
        read_only_fields = ('id', 'created_at')
