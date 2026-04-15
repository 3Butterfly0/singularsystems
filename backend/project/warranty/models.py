from django.db import models

class contact_us(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email_address = models.EmailField()
    phone_number = models.CharField(max_length=12)
    subject = models.CharField(max_length=30)
    message = models.TextField( max_length=500)
    
    def __str__(self):
        return self.email_address