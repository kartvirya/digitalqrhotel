from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from django.http import JsonResponse
from cafe.models import *
from django.views.decorators.csrf import csrf_exempt
from datetime import date, datetime, timedelta
import json

User = get_user_model()


@csrf_exempt
def api_order_status(request, order_id):
    """API endpoint for order status updates"""
    if request.method == 'POST':
        try:
            order_obj = order.objects.get(order_id=order_id)
            new_status = request.POST.get('status')
            if new_status in dict(order.ORDER_STATUS_CHOICES):
                order_obj.status = new_status
                order_obj.save()
                return JsonResponse({'success': True, 'status': new_status})
        except order.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Order not found'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@csrf_exempt
def api_delete_dish(request, item_id):
    """API endpoint for deleting menu items"""
    if request.method == 'DELETE':
        try:
            dish = get_object_or_404(menu_item, id=item_id)
            if request.user.is_superuser:
                dish.delete()
                return JsonResponse({'success': True, 'message': 'Dish removed successfully!'})
            else:
                return JsonResponse({'success': False, 'error': 'Only admins are allowed!'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})


@csrf_exempt
def api_generate_bill(request):
    """API endpoint for generating bills"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            t_number = data.get('table')
            
            order_for_table = order.objects.filter(table=t_number, bill_clear=False)
            total_bill = 0
            now = datetime.now()
            now_ist = now + timedelta(hours=5, minutes=30)

            bill_items = []
            c_name = ''
            c_phone = ''
            
            for o in order_for_table:
                total_bill += int(o.price)
                o.bill_clear = True
                o.save()

                bill_items.append({
                    'order_items': o.items_json,
                })
                c_name = o.name
                c_phone = o.phone

            order_dict = {}
            for item in bill_items:
                for key, value in item.items():
                    order_items = json.loads(value)
                    for pr_key, pr_value in order_items.items():
                        order_dict[pr_value[1].lower()] = [
                            pr_value[0], (pr_value[2] * pr_value[0])
                        ]
            
            new_bill = bill(order_items=order_dict,
                          name=c_name,
                          bill_total=total_bill,
                          phone=c_phone,
                          bill_time=now_ist,
                          table_number=t_number)
            new_bill.save()

            return JsonResponse({
                'success': True,
                'bill_id': new_bill.id,
                'order_dict': order_dict,
                'bill_total': total_bill,
                'name': c_name,
                'phone': c_phone,
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
