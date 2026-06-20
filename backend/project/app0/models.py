import uuid
from django.db import models
from django.conf import settings


class CPU(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    platform = models.CharField(max_length=10, db_index=True)
    name = models.CharField(max_length=100)
    socket = models.CharField(max_length=50, db_index=True, blank=True, null=True)
    wattage = models.IntegerField(default=0)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Motherboard(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    platform = models.CharField(max_length=10, db_index=True)
    name = models.CharField(max_length=100)
    socket = models.CharField(max_length=50, db_index=True, blank=True, null=True)
    ram_type = models.CharField(max_length=20, default="DDR4", db_index=True)
    form_factor = models.CharField(max_length=20, blank=True, null=True)
    wattage = models.IntegerField(default=0)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Cooler(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    wattage = models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Ram(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    ram_type = models.CharField(max_length=20, default="DDR4", db_index=True)
    capacity_gb = models.IntegerField(default=0)
    wattage = models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Storage(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    wattage = models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Gpu(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    wattage = models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    length_mm = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Psu(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    wattage = models.IntegerField(db_index=True)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    def __str__(self):
        return self.name


class Case(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    wattage = models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    stock = models.IntegerField(default=10)
    max_gpu_length_mm = models.IntegerField(null=True, blank=True)
    supported_form_factors = models.JSONField(null=True, blank=True)
    description = models.TextField()
    image = models.ImageField(upload_to="components/", blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['supported_form_factors'], name='case_supp_ff_idx')
        ]

    def __str__(self):
        return self.name


class BuildSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True
    )
    platform = models.CharField(
        max_length=50,
        choices=[("intel", "Intel"), ("amd", "AMD")],
        null=True,
        blank=True,
    )
    purpose = models.CharField(
        max_length=50,
        choices=[
            ("gaming", "Gaming"),
            ("workstation", "Workstation"),
            ("video_editing", "Video Editing"),
        ],
        default="gaming",
        null=True,
        blank=True,
    )
    session_secret = models.CharField(max_length=128, null=True, blank=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ("building", "Building"),
            ("ready_to_buy", "Ready To Buy"),
            ("ordered", "Ordered"),
            ("archived", "Archived"),
        ],
        default="building",
    )

    # Components
    cpu = models.ForeignKey(
        "CPU", on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    motherboard = models.ForeignKey(
        "Motherboard",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
    )
    ram = models.ForeignKey("Ram", on_delete=models.SET_NULL, null=True, blank=True)
    gpu = models.ForeignKey("Gpu", on_delete=models.SET_NULL, null=True, blank=True)
    cooler = models.ForeignKey(
        "Cooler", on_delete=models.SET_NULL, null=True, blank=True
    )
    storage = models.ForeignKey(
        "Storage", on_delete=models.SET_NULL, null=True, blank=True
    )
    psu = models.ForeignKey("Psu", on_delete=models.SET_NULL, null=True, blank=True)
    case = models.ForeignKey("Case", on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    session_expires_at = models.DateTimeField(null=True, blank=True)

    @property
    def estimated_watts(self):
        total = 0
        cpu = self.cpu
        if cpu:
            total += cpu.wattage
        mb = self.motherboard
        if mb:
            total += mb.wattage
        for comp in [self.ram, self.gpu, self.cooler, self.storage, self.case]:
            if comp:
                total += comp.wattage
        return total

    @property
    def total_price(self):
        total = 0
        cpu = self.cpu
        if cpu:
            total += cpu.price
        mb = self.motherboard
        if mb:
            total += mb.price
        for comp in [
            self.ram,
            self.gpu,
            self.cooler,
            self.storage,
            self.psu,
            self.case,
        ]:
            if comp:
                total += comp.price
        return total


class PrebuiltPC(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=[
            ("gaming", "Gaming"),
            ("editing", "Video Editing"),
            ("design", "Graphic Design"),
        ],
        default="gaming",
    )
    price = models.IntegerField(null=True, blank=True)
    stock = models.IntegerField(default=10)
    image = models.ImageField(upload_to="components/", blank=True)

    platform = models.CharField(
        max_length=50, choices=[("intel", "Intel"), ("amd", "AMD")]
    )

    # Components
    cpu = models.ForeignKey("CPU", on_delete=models.SET_NULL, null=True, blank=True)
    motherboard = models.ForeignKey(
        "Motherboard", on_delete=models.SET_NULL, null=True, blank=True
    )
    ram = models.ForeignKey("Ram", on_delete=models.SET_NULL, null=True, blank=True)
    gpu = models.ForeignKey("Gpu", on_delete=models.SET_NULL, null=True, blank=True)
    cooler = models.ForeignKey(
        "Cooler", on_delete=models.SET_NULL, null=True, blank=True
    )
    storage = models.ForeignKey(
        "Storage", on_delete=models.SET_NULL, null=True, blank=True
    )
    psu = models.ForeignKey("Psu", on_delete=models.SET_NULL, null=True, blank=True)
    case = models.ForeignKey("Case", on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def total_price(self):
        if self.price:
            return self.price
        total = 0
        cpu = self.cpu
        if cpu:
            total += cpu.price
        mb = self.motherboard
        if mb:
            total += mb.price
        for comp in [
            self.ram,
            self.gpu,
            self.cooler,
            self.storage,
            self.psu,
            self.case,
        ]:
            if comp:
                total += comp.price
        return total


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    build_session = models.OneToOneField("BuildSession", on_delete=models.PROTECT)
    shipping_address = models.ForeignKey('UserAddress', on_delete=models.PROTECT, null=True, blank=True)
    payment_status = models.CharField(
        max_length=50,
        choices=[('pending','Pending'),('paid','Paid'),('failed','Failed'),('refunded','Refunded')],
        default='pending'
    )
    total_price = models.IntegerField()
    status = models.CharField(
        max_length=50,
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("shipped", "Shipped"),
            ("delivered", "Delivered"),
            ("cancelled", "Cancelled"),
        ],
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.id} for {self.user}"

class UserAddress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    address_line1 = models.TextField()
    address_line2 = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='items')
    component_type = models.CharField(max_length=50)   # e.g. 'cpu', 'gpu'
    component_id = models.CharField(max_length=50)     # hardware PK
    price_at_purchase = models.IntegerField()           # price locked at checkout

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('Order', on_delete=models.PROTECT, related_name='payments')
    transaction_reference = models.CharField(max_length=255, unique=True)
    payment_method = models.CharField(max_length=50)   # 'UPI', 'Card', 'NetBanking'
    amount = models.IntegerField()                      # amount in paise
    gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    guest_token = models.CharField(max_length=128, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart {self.id}"


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=20)   # 'custom_build' | 'prebuilt'
    build_session = models.ForeignKey('BuildSession', null=True, blank=True, on_delete=models.CASCADE)
    prebuilt = models.ForeignKey('PrebuiltPC', null=True, blank=True, on_delete=models.CASCADE)
    price_at_add = models.IntegerField()
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"CartItem {self.id} for Cart {self.cart.id}"
