from django.shortcuts import render
from .serializers import contact_usSerializer
from .models import contact_us
from rest_framework import viewsets  

# Create your views here.

class contact_usView(viewsets.ModelViewSet):
    serializer_class = contact_usSerializer
    queryset = contact_us.objects.all()
    