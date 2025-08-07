from django.contrib import admin
from django.urls import path, include
from cafe import views
from cafe.api_views import (
    MenuItemViewSet, TableViewSet, OrderViewSet, RatingViewSet, 
    BillViewSet, AuthViewSet, DashboardViewSet
)
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

# API Router
router = DefaultRouter()
router.register(r'api/menu', MenuItemViewSet)
router.register(r'api/tables', TableViewSet)
router.register(r'api/orders', OrderViewSet)
router.register(r'api/ratings', RatingViewSet)
router.register(r'api/bills', BillViewSet)
router.register(r'api/auth', AuthViewSet, basename='auth')
router.register(r'api/dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
    
    # Legacy Django views (for admin panel)
    path('admin/', admin.site.urls),
    path('delete_dish/<int:item_id>/', views.delete_dish, name='delete_dish'),
    path('generate_bill', views.generate_bill, name='generate_bill'),
    path('view_bills', views.view_bills, name='view_bills'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
