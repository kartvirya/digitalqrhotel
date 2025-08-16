"""pr1 URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from cafe.api_views import (
    MenuItemViewSet, TableViewSet, RoomViewSet, OrderViewSet, RatingViewSet, 
    BillViewSet, AuthViewSet, DashboardViewSet, FloorViewSet,
    DepartmentViewSet, RoleViewSet, StaffViewSet, AttendanceViewSet, LeaveViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'menu', MenuItemViewSet)
router.register(r'tables', TableViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'floors', FloorViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'ratings', RatingViewSet)
router.register(r'bills', BillViewSet)
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('', include('cafe.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = 'SnackDonalds Admin'
admin.site.index_title = 'SnackDonalds Admin Portal'
admin.site.site_title = 'SnackDonalds'
