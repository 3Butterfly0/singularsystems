from django.db import models

class intelCPU(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name
    
class intelMotherboard(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class amdCPU(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
    wattage=models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    description = models.TextField()
    image = models.ImageField(upload_to='static/images/', blank=True)

    def __str__(self):
        return self.name

class amdMotherboard(models.Model):
    id=models.CharField(max_length=50,primary_key=True)
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
    