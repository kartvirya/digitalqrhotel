from rest_framework import serializers
from .models import User, Table, Floor, Room, menu_item, order, rating, bill, Department, Role, Staff, Attendance, Leave
import json


class FloorSerializer(serializers.ModelSerializer):
    table_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Floor
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'table_count']
        read_only_fields = ['id', 'created_at']
    
    def get_table_count(self, obj):
        return obj.tables.count()


class UserSerializer(serializers.ModelSerializer):
    staff_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'phone', 'cafe_manager', 'is_superuser', 'order_count', 'staff_profile']
        read_only_fields = ['id', 'order_count']
    
    def get_staff_profile(self, obj):
        try:
            staff = obj.staff_profile
            if staff:
                return {
                    'id': staff.id,
                    'employee_id': staff.employee_id,
                    'full_name': staff.full_name,
                    'email': staff.email,
                    'phone': staff.phone,
                    'department': {
                        'id': staff.department.id,
                        'name': staff.department.name
                    },
                    'role': {
                        'id': staff.role.id,
                        'name': staff.role.name
                    },
                    'hire_date': staff.hire_date,
                    'salary': staff.salary,
                    'employment_status': staff.employment_status
                }
            return None
        except:
            return None


class TableSerializer(serializers.ModelSerializer):
    qr_code_url = serializers.SerializerMethodField()
    floor_name = serializers.CharField(source='floor.name', read_only=True)
    has_active_order = serializers.SerializerMethodField()
    
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'table_name', 'capacity', 'is_active', 'qr_code', 'qr_code_url', 'qr_unique_id', 'created_at', 'visual_x', 'visual_y', 'floor', 'floor_name', 'has_active_order']
        read_only_fields = ['id', 'qr_code', 'qr_code_url', 'qr_unique_id', 'created_at']
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            return self.context['request'].build_absolute_uri(obj.qr_code.url)
        return None
    
    def get_has_active_order(self, obj):
        from .models import order
        # Check if there's an active order for this table
        # Active orders are those that are not completed/cancelled
        active_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'served']
        return order.objects.filter(
            table_unique_id=obj.qr_unique_id,
            status__in=active_statuses
        ).exists()


class RoomSerializer(serializers.ModelSerializer):
    qr_code_url = serializers.SerializerMethodField()
    floor_name = serializers.CharField(source='floor.name', read_only=True)
    has_active_order = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = ['id', 'room_number', 'room_name', 'room_type', 'floor', 'floor_name', 'capacity', 'price_per_night', 'is_active', 'room_status', 'qr_code', 'qr_code_url', 'qr_unique_id', 'description', 'amenities', 'created_at', 'updated_at', 'has_active_order']
        read_only_fields = ['id', 'qr_code', 'qr_code_url', 'qr_unique_id', 'created_at', 'updated_at']
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            return self.context['request'].build_absolute_uri(obj.qr_code.url)
        return None
    
    def get_has_active_order(self, obj):
        from .models import order
        # Check if there's an active order for this room
        active_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'served']
        return order.objects.filter(
            room_unique_id=obj.qr_unique_id,
            status__in=active_statuses
        ).exists()


class MenuItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = menu_item
        fields = ['id', 'name', 'category', 'description', 'image', 'image_url', 'price', 'is_available']
        read_only_fields = ['id']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_price(self, obj):
        try:
            return float(obj.price)
        except (ValueError, TypeError):
            return 0.0


class OrderSerializer(serializers.ModelSerializer):
    items_json = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    table = serializers.CharField(read_only=True)
    table_unique_id = serializers.CharField(read_only=True)
    room_unique_id = serializers.CharField(read_only=True)
    order_type = serializers.CharField(read_only=True)
    
    class Meta:
        model = order
        fields = ['id', 'name', 'phone', 'table', 'price', 'status', 'estimated_time', 'created_at', 'updated_at', 'special_instructions', 'items_json', 'table_unique_id', 'room_unique_id', 'order_type']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='name')
    created_at = serializers.DateField(source='r_date')
    updated_at = serializers.DateField(source='r_date')

    class Meta:
        model = rating
        fields = ['id', 'user_name', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BillSerializer(serializers.ModelSerializer):
    order_items = serializers.JSONField()
    
    class Meta:
        model = bill
        fields = ['id', 'order_items', 'name', 'bill_total', 'phone', 'bill_time', 'table_number']
        read_only_fields = ['id', 'bill_time']


class OrderCreateSerializer(serializers.ModelSerializer):
    items_json = serializers.JSONField()
    
    class Meta:
        model = order
        fields = ['id', 'items_json', 'name', 'phone', 'table', 'table_unique_id', 'price', 'special_instructions', 'status', 'estimated_time', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set default values for required fields
        validated_data.setdefault('status', 'pending')
        validated_data.setdefault('estimated_time', 20)
        validated_data.setdefault('bill_clear', False)
        return super().create(validated_data)


class DepartmentSerializer(serializers.ModelSerializer):
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at', 'staff_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_staff_count(self, obj):
        return obj.staff.count()

class RoleSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'department', 'department_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'employee_id', 'user', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone',
            'department', 'department_name', 'role', 'role_name', 'hire_date', 'salary',
            'employment_status', 'is_active', 'profile_picture', 'profile_picture_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return self.context['request'].build_absolute_uri(obj.profile_picture.url)
        return None

class StaffCreateSerializer(serializers.ModelSerializer):
    user_data = serializers.DictField(write_only=True)

    class Meta:
        model = Staff
        fields = [
            'employee_id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone',
            'department', 'role', 'hire_date', 'salary', 'user_data'
        ]

    def create(self, validated_data):
        user_data = validated_data.pop('user_data')
        
        # Create user account (User model only has phone field)
        user = User.objects.create_user(
            phone=user_data['phone'],
            password=user_data['password']
        )
        
        # Create staff profile
        staff = Staff.objects.create(user=user, **validated_data)
        return staff

class AttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    staff_employee_id = serializers.CharField(source='staff.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'staff', 'staff_name', 'staff_employee_id', 'date', 'check_in_time',
            'check_out_time', 'status', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LeaveSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    staff_employee_id = serializers.CharField(source='staff.employee_id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = Leave
        fields = [
            'id', 'staff', 'staff_name', 'staff_employee_id', 'leave_type', 'start_date',
            'end_date', 'reason', 'status', 'approved_by', 'approved_by_name', 'approved_at',
            'notes', 'duration_days', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
