
from django.contrib import admin
from django.urls import path,include
from rest_framework import routers
from app0 import views
from contact import views as views2
from accounts import views as views3


admin.site.site_header = "SingularSystems Admin"
admin.site.site_title = "SingularSystems Admin Portal"
admin.site.index_title = "Welcome to SingularSystems Admin Portal"


router = routers.DefaultRouter()
router.register(r'CPU', views.CPUView, 'CPU')
router.register(r'Motherboard', views.MotherboardView, 'Motherboard')
router.register(r'cooler', views.CoolerView, 'cooler')
router.register(r'ram', views.RamView, 'ram')
router.register(r'storage', views.StorageView, 'storage')
router.register(r'gpu', views.GpuView, 'gpu')
router.register(r'psu', views.PsuView, 'psu')
router.register(r'case', views.CaseView, 'case')

router.register(r'contact_us', views2.contact_usView, 'contact_us')



urlpatterns = [
    path('admin/', admin.site.urls),   
    path('api/', include(router.urls)),     
    path('api/builder/', include('app0.builder.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/cart/', include('app0.cart_urls')),
    path('api/orders/', include('app0.orders_urls')),
    path('api/llm/', include('llm.urls')),
]