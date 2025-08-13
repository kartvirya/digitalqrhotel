from django.db import models
from django.contrib.auth.models import AbstractUser
from .manager import UserManager
import qrcode
from io import BytesIO
from django.core.files import File
from django.core.files.base import ContentFile
from PIL import Image
import uuid
# Create your models here.


class User(AbstractUser):

    email = None
    username = None
    phone = models.CharField(max_length=10, unique=True)
    phone_verified = models.BooleanField(default=False)
    cafe_manager = models.BooleanField(default=False)
    order_count = models.IntegerField(default=0)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []


class Floor(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


class Table(models.Model):
    id = models.AutoField(primary_key=True)
    table_number = models.CharField(max_length=10, unique=True)
    table_name = models.CharField(max_length=50, blank=True, null=True)
    capacity = models.IntegerField(default=4)
    is_active = models.BooleanField(default=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    qr_unique_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    # Visual layout positions
    visual_x = models.IntegerField(default=0)
    visual_y = models.IntegerField(default=0)
    # Floor relationship
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='tables', null=True, blank=True)
    
    def __str__(self):
        return f"Table {self.table_number} - {self.table_name or 'Table'}"
    
    def save(self, *args, **kwargs):
        if not self.qr_unique_id:
            self.qr_unique_id = str(uuid.uuid4())
        super().save(*args, **kwargs)
        if not self.qr_code:
            self.generate_qr_code()
    
    def generate_qr_code(self):
        # Generate QR code with table-specific URL
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        # URL for table-specific ordering - using network IP
        from django.conf import settings
        url = f"{settings.FRONTEND_URL}/?table={self.qr_unique_id}"
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save the QR code image
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        filename = f"table_{self.table_number}_qr.png"
        
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)
        self.save(update_fields=['qr_code'])


class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('single', 'Single Room'),
        ('double', 'Double Room'),
        ('triple', 'Triple Room'),
        ('suite', 'Suite'),
        ('deluxe', 'Deluxe Room'),
        ('presidential', 'Presidential Suite'),
    ]
    
    ROOM_STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
        ('reserved', 'Reserved'),
        ('cleaning', 'Being Cleaned'),
    ]
    
    id = models.AutoField(primary_key=True)
    room_number = models.CharField(max_length=10, unique=True)
    room_name = models.CharField(max_length=100, blank=True, null=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='single')
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
    capacity = models.IntegerField(default=2)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    room_status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default='available')
    qr_code = models.ImageField(upload_to='room_qr_codes/', blank=True, null=True)
    qr_unique_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    description = models.TextField(blank=True, null=True)
    amenities = models.TextField(blank=True, null=True)  # JSON string of amenities
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Room {self.room_number} - {self.get_room_type_display()}"
    
    def save(self, *args, **kwargs):
        if not self.qr_unique_id:
            self.qr_unique_id = str(uuid.uuid4())
        super().save(*args, **kwargs)
        if not self.qr_code:
            self.generate_qr_code()
    
    def generate_qr_code(self):
        # Generate QR code with room-specific URL
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        # URL for room-specific ordering - using network IP
        from django.conf import settings
        url = f"{settings.FRONTEND_URL}/?room={self.qr_unique_id}"
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save the QR code image
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        filename = f"room_{self.room_number}_qr.png"
        
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)
        self.save(update_fields=['qr_code'])
    
    class Meta:
        ordering = ['floor', 'room_number']


class menu_item(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    description = models.CharField(max_length=250)
    image = models.ImageField(upload_to='fimage', blank=True, null=True)
    price = models.CharField(max_length=4, default='0')
    list_order = models.IntegerField()
    is_available = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class rating(models.Model):

    name = models.CharField(max_length=30)
    comment = models.CharField(max_length=250)
    r_date = models.DateField()

    def __str__(self):
        return f"{self.name}\'s review"


class order(models.Model):
    id = models.AutoField(primary_key=True)
    items_json = models.CharField(max_length=5000)
    name = models.CharField(max_length=30)
    phone = models.CharField(max_length=10)
    table = models.CharField(max_length=15)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bill_clear = models.BooleanField()
    estimated_time = models.IntegerField()
    special_instructions = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20)
    table_unique_id = models.CharField(max_length=50, null=True, blank=True)
    room_unique_id = models.CharField(max_length=50, null=True, blank=True)  # For room orders
    order_type = models.CharField(max_length=10, choices=[('table', 'Table'), ('room', 'Room')], default='table')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.id} - {self.name}"


class bill(models.Model):
    order_items = models.CharField(max_length=5000)
    name = models.CharField(default='', max_length=50)
    bill_total = models.IntegerField()
    phone = models.CharField(max_length=10)
    bill_time = models.DateTimeField()
    table_number = models.CharField(max_length=10, blank=True, null=True)


class Department(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Role(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='roles')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.department.name}"

    class Meta:
        ordering = ['department', 'name']

class Staff(models.Model):
    EMPLOYMENT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('terminated', 'Terminated'),
        ('on_leave', 'On Leave'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    id = models.AutoField(primary_key=True)
    employee_id = models.CharField(max_length=20, unique=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=15)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='staff')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='staff')
    hire_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)
    profile_picture = models.ImageField(upload_to='staff_profiles/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        ordering = ['employee_id']

class Attendance(models.Model):
    ATTENDANCE_STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
        ('leave', 'Leave'),
    ]

    id = models.AutoField(primary_key=True)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in_time = models.TimeField(blank=True, null=True)
    check_out_time = models.TimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['staff', 'date']
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.staff.full_name} - {self.date} - {self.status}"

class Leave(models.Model):
    LEAVE_TYPE_CHOICES = [
        ('annual', 'Annual Leave'),
        ('sick', 'Sick Leave'),
        ('personal', 'Personal Leave'),
        ('maternity', 'Maternity Leave'),
        ('paternity', 'Paternity Leave'),
        ('other', 'Other'),
    ]

    LEAVE_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.AutoField(primary_key=True)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=LEAVE_STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.staff.full_name} - {self.leave_type} - {self.start_date} to {self.end_date}"

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1
