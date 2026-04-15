from django.contrib import admin
from .models import intelCPU, intelMotherboard, amdCPU, amdMotherboard, cooler, ram, storage, gpu ,psu,case

# Register your models here.

admin.site.register(intelCPU)
admin.site.register(intelMotherboard)
admin.site.register(amdCPU)
admin.site.register(amdMotherboard)
admin.site.register(cooler)
admin.site.register(ram)
admin.site.register(storage)
admin.site.register(gpu)
admin.site.register(psu)
admin.site.register(case)
