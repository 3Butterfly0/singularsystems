from rest_framework import serializers
from .models import contact_us

class contact_usSerializer(serializers.ModelSerializer):
    class Meta:
        model = contact_us
        fields = ('first_name','last_name','email_address', 'phone_number', 'subject','message')
