
from django.contrib import admin
from django.urls import path,include
from rest_framework import routers
from app0 import views
from warranty import views as views2
from accounts import views as views3


admin.site.site_header = "SingularSystems Admin"
admin.site.site_title = "SingularSystems Admin Portal"
admin.site.index_title = "Welcome to SingularSystems Admin Portal"


router = routers.DefaultRouter()
router.register(r'intelCPU', views.intelCPUView, 'intelCPU')
router.register(r'intelMotherboard', views.intelMotherboardView, 'intelMotherboard')
router.register(r'amdCPU', views.amdCPUView, 'amdCPU')
router.register(r'amdMotherboard', views.amdMotherboardView, 'amdMotherboard')
router.register(r'cooler', views.coolerView, 'cooler')
router.register(r'ram', views.ramView, 'ram')
router.register(r'storage', views.storageView, 'storage')
router.register(r'gpu', views.gpuView, 'gpu')
router.register(r'psu', views.psuView, 'psu')
router.register(r'case', views.caseView, 'case')

router.register(r'contact_us', views2.contact_usView, 'contact_us')



urlpatterns = [
    path('admin/', admin.site.urls),   
    path('api/', include(router.urls)),     
    path('api/builder/', include('app0.builder.urls')),
    path('accounts/', include('accounts.urls')),      
]