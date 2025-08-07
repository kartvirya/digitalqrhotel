from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from datetime import date
import json
from django.utils import timezone
from datetime import date, datetime
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import (
    User, Table, Floor, Room, menu_item, order, rating, bill,
    Department, Role, Staff, Attendance, Leave
)
from .serializers import (
    UserSerializer, TableSerializer, FloorSerializer, RoomSerializer, MenuItemSerializer, 
    OrderSerializer, RatingSerializer, BillSerializer, OrderCreateSerializer,
    DepartmentSerializer, RoleSerializer, StaffSerializer, StaffCreateSerializer,
    AttendanceSerializer, LeaveSerializer
)


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = menu_item.objects.filter(is_available=True).order_by('category', 'name')
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = menu_item.objects.filter(is_available=True).order_by('category', 'name')
        return queryset


class FloorViewSet(viewsets.ModelViewSet):
    queryset = Floor.objects.all().order_by('name')
    serializer_class = FloorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return Floor.objects.all().order_by('name')
        return Floor.objects.filter(is_active=True).order_by('name')
    
    def perform_create(self, serializer):
        # Only superusers and cafe managers can create floors
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can create floors")
        serializer.save()
    
    def perform_update(self, serializer):
        # Only superusers and cafe managers can update floors
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can update floors")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only superusers and cafe managers can delete floors
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can delete floors")
        instance.delete()


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('table_number')
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Table.objects.all().order_by('table_number')
        
        # Filter by floor if specified
        floor_id = self.request.query_params.get('floor')
        if floor_id:
            queryset = queryset.filter(floor_id=floor_id)
        
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return queryset
        return queryset.filter(is_active=True)
    
    def perform_create(self, serializer):
        # Only superusers and cafe managers can create tables
        print(f"User: {self.request.user}, is_authenticated: {self.request.user.is_authenticated}, is_superuser: {self.request.user.is_superuser}, cafe_manager: {getattr(self.request.user, 'cafe_manager', False)}")
        if not (self.request.user.is_superuser or getattr(self.request.user, 'cafe_manager', False)):
            raise permissions.PermissionDenied("Only administrators can create tables")
        serializer.save()
    
    def perform_update(self, serializer):
        # Only superusers and cafe managers can update tables
        if not (self.request.user.is_superuser or getattr(self.request.user, 'cafe_manager', False)):
            raise permissions.PermissionDenied("Only administrators can update tables")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only superusers and cafe managers can delete tables
        if not (self.request.user.is_superuser or getattr(self.request.user, 'cafe_manager', False)):
            raise permissions.PermissionDenied("Only administrators can delete tables")
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        table = self.get_object()
        if table.qr_code:
            return Response({'qr_code_url': request.build_absolute_uri(table.qr_code.url)})
        return Response({'error': 'QR code not generated'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def regenerate_qr(self, request, pk=None):
        table = self.get_object()
        table.generate_qr_code()
        return Response({'message': 'QR code regenerated successfully'})
    
    @action(detail=True, methods=['post'])
    def update_position(self, request, pk=None):
        table = self.get_object()
        visual_x = request.data.get('visual_x')
        visual_y = request.data.get('visual_y')
        
        if visual_x is not None and visual_y is not None:
            table.visual_x = visual_x
            table.visual_y = visual_y
            table.save()
            return Response({'message': 'Position updated successfully'})
        return Response({'error': 'visual_x and visual_y are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_floor(self, request):
        floor_id = request.query_params.get('floor_id')
        if floor_id:
            tables = Table.objects.filter(floor_id=floor_id, is_active=True)
            serializer = self.get_serializer(tables, many=True)
            return Response(serializer.data)
        return Response({'error': 'floor_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('floor', 'room_number')
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Room.objects.all().order_by('floor', 'room_number')
        
        # Filter by floor if specified
        floor_id = self.request.query_params.get('floor')
        if floor_id:
            queryset = queryset.filter(floor_id=floor_id)
        
        # Filter by room status if specified
        room_status = self.request.query_params.get('status')
        if room_status:
            queryset = queryset.filter(room_status=room_status)
        
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return queryset
        return queryset.filter(is_active=True)
    
    def perform_create(self, serializer):
        # Only superusers and cafe managers can create rooms
        if not (self.request.user.is_superuser or getattr(self.request.user, 'cafe_manager', False)):
            raise permissions.PermissionDenied("Only administrators can create rooms")
        serializer.save()
    
    def perform_update(self, serializer):
        # Only superusers and cafe managers can update rooms
        if not (self.request.user.is_superuser or getattr(self.request.user, 'cafe_manager', False)):
            raise permissions.PermissionDenied("Only administrators can update rooms")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only superusers and cafe managers can delete rooms
        if not (self.request.user.is_superuser or getattr(self.request.user, 'cafe_manager', False)):
            raise permissions.PermissionDenied("Only administrators can delete rooms")
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        room = self.get_object()
        if room.qr_code:
            return Response({'qr_code_url': request.build_absolute_uri(room.qr_code.url)})
        return Response({'error': 'QR code not generated'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def regenerate_qr(self, request, pk=None):
        room = self.get_object()
        room.generate_qr_code()
        return Response({'message': 'QR code regenerated successfully'})
    
    @action(detail=False, methods=['get'])
    def by_floor(self, request):
        floor_id = request.query_params.get('floor_id')
        if floor_id:
            rooms = Room.objects.filter(floor_id=floor_id, is_active=True)
            serializer = self.get_serializer(rooms, many=True)
            return Response(serializer.data)
        return Response({'error': 'floor_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available rooms"""
        rooms = Room.objects.filter(room_status='available', is_active=True)
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def occupied(self, request):
        """Get all occupied rooms"""
        rooms = Room.objects.filter(room_status='occupied', is_active=True)
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def regenerate_qr(self, request, pk=None):
        table = self.get_object()
        # Delete existing QR code
        if table.qr_code:
            table.qr_code.delete()
        # Generate new QR code
        table.generate_qr_code()
        table.save()
        serializer = self.get_serializer(table)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_position(self, request, pk=None):
        table = self.get_object()
        x = request.data.get('x', 0)
        y = request.data.get('y', 0)
        
        table.visual_x = x
        table.visual_y = y
        table.save()
        
        serializer = self.get_serializer(table)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_floor(self, request):
        floor_id = request.query_params.get('floor')
        if floor_id:
            tables = Table.objects.filter(floor_id=floor_id).order_by('table_number')
            serializer = self.get_serializer(tables, many=True)
            return Response(serializer.data)
        return Response({'error': 'Floor parameter required'}, status=status.HTTP_400_BAD_REQUEST)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return order.objects.all().order_by('-created_at')
        elif user.is_authenticated:
            return order.objects.filter(phone=user.phone).order_by('-created_at')
        return order.objects.none()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order_obj = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(order.ORDER_STATUS_CHOICES):
            order_obj.status = new_status
            order_obj.save()
            return Response({'success': True, 'status': new_status})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_table(self, request):
        table_number = request.query_params.get('table')
        if table_number:
            orders = order.objects.filter(table=table_number).order_by('-created_at')
            serializer = self.get_serializer(orders, many=True)
            return Response(serializer.data)
        return Response({'error': 'Table parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # For regular users, filter by their phone number
        if request.user.is_superuser or request.user.cafe_manager:
            user_orders = order.objects.all().order_by('-created_at')
        else:
            user_orders = order.objects.filter(phone=request.user.phone).order_by('-created_at')
        
        serializer = self.get_serializer(user_orders, many=True)
        return Response(serializer.data)


class RatingViewSet(viewsets.ModelViewSet):
    queryset = rating.objects.all().order_by('-r_date')
    serializer_class = RatingSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        user = self.request.user
        # Set the name to user's full name or phone if no name
        user_name = f"{user.first_name} {user.last_name}".strip()
        if not user_name:
            user_name = user.phone
        serializer.save(name=user_name)


class BillViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = bill.objects.all().order_by('-bill_time')
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        phone = request.data.get('phone')
        password = request.data.get('password')
        
        user = authenticate(phone=phone, password=password)
        if user:
            login(request, user)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})
    
    @action(detail=False, methods=['post'])
    def signup(self, request):
        phone = request.data.get('phone')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        if User.objects.filter(phone=phone).exists():
            return Response({'error': 'Phone number already registered'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(phone=phone, password=password)
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        
        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def current_user(self, request):
        if request.user.is_authenticated:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not (request.user.is_superuser or request.user.cafe_manager):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        total_orders = order.objects.count()
        total_menu_items = menu_item.objects.filter(is_available=True).count()
        total_tables = Table.objects.filter(is_active=True).count()
        
        # Calculate total revenue
        total_revenue = sum(bill.bill_total for bill in bill.objects.all())
        
        # Get recent orders (last 5)
        recent_orders = order.objects.all().order_by('-created_at')[:5]
        recent_orders_data = []
        for order_obj in recent_orders:
            recent_orders_data.append({
                'id': order_obj.id,
                'total_amount': order_obj.price,
                'status': order_obj.status,
                'table_unique_id': order_obj.table_unique_id
            })
        
        # Get popular items (mock data for now)
        popular_items = []
        menu_items = menu_item.objects.filter(is_available=True)[:5]
        for item in menu_items:
            popular_items.append({
                'name': item.name,
                'order_count': 0,  # This would need to be calculated from order history
                'revenue': 0  # This would need to be calculated from order history
            })
        
        return Response({
            'total_orders': total_orders,
            'total_menu_items': total_menu_items,
            'total_tables': total_tables,
            'total_revenue': total_revenue,
            'recent_orders': recent_orders_data,
            'popular_items': popular_items
        })


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return Department.objects.all().order_by('name')
        return Department.objects.filter(is_active=True).order_by('name')

    def perform_create(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can create departments")
        serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can update departments")
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can delete departments")
        instance.delete()

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('department', 'name')
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return Role.objects.all().order_by('department', 'name')
        return Role.objects.filter(is_active=True).order_by('department', 'name')

    def perform_create(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can create roles")
        serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can update roles")
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can delete roles")
        instance.delete()

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        department_id = request.query_params.get('department')
        if department_id:
            roles = Role.objects.filter(department_id=department_id).order_by('name')
            serializer = self.get_serializer(roles, many=True)
            return Response(serializer.data)
        return Response({'error': 'Department parameter required'}, status=status.HTTP_400_BAD_REQUEST)

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().order_by('employee_id')
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return StaffCreateSerializer
        return StaffSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return Staff.objects.all().order_by('employee_id')
        return Staff.objects.filter(is_active=True).order_by('employee_id')

    def perform_create(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can create staff")
        serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can update staff")
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can delete staff")
        instance.delete()

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        department_id = request.query_params.get('department')
        if department_id:
            staff = Staff.objects.filter(department_id=department_id).order_by('employee_id')
            serializer = self.get_serializer(staff, many=True)
            return Response(serializer.data)
        return Response({'error': 'Department parameter required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def active_staff(self, request):
        staff = Staff.objects.filter(employment_status='active', is_active=True).order_by('employee_id')
        serializer = self.get_serializer(staff, many=True)
        return Response(serializer.data)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date', '-created_at')
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return Attendance.objects.all().order_by('-date', '-created_at')
        # Staff can only see their own attendance
        if hasattr(user, 'staff_profile'):
            return Attendance.objects.filter(staff=user.staff_profile).order_by('-date', '-created_at')
        return Attendance.objects.none()

    def perform_create(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            # Staff can only create their own attendance
            if hasattr(self.request.user, 'staff_profile'):
                serializer.save(staff=self.request.user.staff_profile)
            else:
                raise permissions.PermissionDenied("You can only create your own attendance")
        else:
            serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            # Staff can only update their own attendance
            if hasattr(self.request.user, 'staff_profile') and serializer.instance.staff == self.request.user.staff_profile:
                serializer.save()
            else:
                raise permissions.PermissionDenied("You can only update your own attendance")
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            # Staff can only delete their own attendance
            if hasattr(self.request.user, 'staff_profile') and instance.staff == self.request.user.staff_profile:
                instance.delete()
            else:
                raise permissions.PermissionDenied("You can only delete your own attendance")
        else:
            instance.delete()

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        if not hasattr(request.user, 'staff_profile'):
            return Response({'error': 'Staff profile not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        today = date.today()
        attendance, created = Attendance.objects.get_or_create(
            staff=request.user.staff_profile,
            date=today,
            defaults={'check_in_time': timezone.now().time(), 'status': 'present'}
        )
        
        if not created:
            attendance.check_in_time = timezone.now().time()
            attendance.status = 'present'
            attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        if not hasattr(request.user, 'staff_profile'):
            return Response({'error': 'Staff profile not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        today = date.today()
        try:
            attendance = Attendance.objects.get(staff=request.user.staff_profile, date=today)
            attendance.check_out_time = timezone.now().time()
            attendance.save()
            serializer = self.get_serializer(attendance)
            return Response(serializer.data)
        except Attendance.DoesNotExist:
            return Response({'error': 'No attendance record found for today'}, status=status.HTTP_400_BAD_REQUEST)

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all().order_by('-start_date')
    serializer_class = LeaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.cafe_manager):
            return Leave.objects.all().order_by('-start_date')
        # Staff can only see their own leaves
        if hasattr(user, 'staff_profile'):
            return Leave.objects.filter(staff=user.staff_profile).order_by('-start_date')
        return Leave.objects.none()

    def perform_create(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            # Staff can only create their own leaves
            if hasattr(self.request.user, 'staff_profile'):
                serializer.save(staff=self.request.user.staff_profile)
            else:
                raise permissions.PermissionDenied("You can only create your own leave requests")
        else:
            serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            # Staff can only update their own leaves
            if hasattr(self.request.user, 'staff_profile') and serializer.instance.staff == self.request.user.staff_profile:
                serializer.save()
            else:
                raise permissions.PermissionDenied("You can only update your own leave requests")
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            # Staff can only delete their own leaves
            if hasattr(self.request.user, 'staff_profile') and instance.staff == self.request.user.staff_profile:
                instance.delete()
            else:
                raise permissions.PermissionDenied("You can only delete your own leave requests")
        else:
            instance.delete()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can approve leaves")
        
        leave = self.get_object()
        leave.status = 'approved'
        leave.approved_by = self.request.user.staff_profile if hasattr(self.request.user, 'staff_profile') else None
        leave.approved_at = timezone.now()
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not (self.request.user.is_superuser or self.request.user.cafe_manager):
            raise permissions.PermissionDenied("Only administrators can reject leaves")
        
        leave = self.get_object()
        leave.status = 'rejected'
        leave.approved_by = self.request.user.staff_profile if hasattr(self.request.user, 'staff_profile') else None
        leave.approved_at = timezone.now()
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response(serializer.data)
