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
    
    # Additional API endpoints
    path('api/order-status/<int:order_id>/', views.api_order_status, name='api_order_status'),
    path('api/delete-dish/<int:item_id>/', views.api_delete_dish, name='api_delete_dish'),
    path('api/generate-bill/', views.api_generate_bill, name='api_generate_bill'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
