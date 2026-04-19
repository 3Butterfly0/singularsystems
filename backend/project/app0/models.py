import uuid
from django.db import models
from django.conf import settings

class intelCPU(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    socket = models.CharField(max_length=50, blank=True, null=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name
    
class intelMotherboard(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    socket = models.CharField(max_length=50, blank=True, null=True)
    ram_type = models.CharField(max_length=20, default='DDR4')
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class amdCPU(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    socket = models.CharField(max_length=50, blank=True, null=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class amdMotherboard(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    socket = models.CharField(max_length=50, blank=True, null=True)
    ram_type = models.CharField(max_length=20, default='DDR4')
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class cooler(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name
    
class ram(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    ram_type = models.CharField(max_length=20, default='DDR4')
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name
    
class storage(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class gpu(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class psu(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class case(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)
    
    def __str__(self):
        return self.name

class BuildSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    platform = models.CharField(max_length=50, choices=[('intel', 'Intel'), ('amd', 'AMD')], null=True, blank=True)
    session_secret = models.CharField(max_length=128, null=True, blank=True)
    status = models.CharField(max_length=50, choices=[('building', 'Building'), ('ready_to_buy', 'Ready To Buy'), ('archived', 'Archived')], default='building')
    
    # Components
    intel_cpu = models.ForeignKey('intelCPU', on_delete=models.SET_NULL, null=True, blank=True)
    amd_cpu = models.ForeignKey('amdCPU', on_delete=models.SET_NULL, null=True, blank=True)
    intel_motherboard = models.ForeignKey('intelMotherboard', on_delete=models.SET_NULL, null=True, blank=True)
    amd_motherboard = models.ForeignKey('amdMotherboard', on_delete=models.SET_NULL, null=True, blank=True)
    ram = models.ForeignKey('ram', on_delete=models.SET_NULL, null=True, blank=True)
    gpu = models.ForeignKey('gpu', on_delete=models.SET_NULL, null=True, blank=True)
    cooler = models.ForeignKey('cooler', on_delete=models.SET_NULL, null=True, blank=True)
    storage = models.ForeignKey('storage', on_delete=models.SET_NULL, null=True, blank=True)
    psu = models.ForeignKey('psu', on_delete=models.SET_NULL, null=True, blank=True)
    case = models.ForeignKey('case', on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def estimated_watts(self):
        total = 0
        cpu = self.intel_cpu if self.platform == 'intel' else self.amd_cpu
        if cpu: total += cpu.wattage
        mb = self.intel_motherboard if self.platform == 'intel' else self.amd_motherboard
        if mb: total += mb.wattage
        for comp in [self.ram, self.gpu, self.cooler, self.storage, self.case]:
            if comp: total += comp.wattage
        return total

    @property
    def total_price(self):
        total = 0
        cpu = self.intel_cpu if self.platform == 'intel' else self.amd_cpu
        if cpu: total += cpu.price
        mb = self.intel_motherboard if self.platform == 'intel' else self.amd_motherboard
        if mb: total += mb.price
        for comp in [self.ram, self.gpu, self.cooler, self.storage, self.psu, self.case]:
            if comp: total += comp.price
        return total