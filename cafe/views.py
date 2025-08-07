from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib import messages
from cafe.models import *
from django.core.files.storage import FileSystemStorage
from datetime import date, datetime, timedelta
import json, ast
from itertools import groupby
from django.db.models import Sum
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()


def menu(request):
    context = {}
    
    # Get table parameter from QR code
    table_unique_id = request.GET.get('table')
    context['table_unique_id'] = table_unique_id
    
    # Get table info if table_unique_id is provided
    if table_unique_id:
        try:
            table_obj = Table.objects.get(qr_unique_id=table_unique_id, is_active=True)
            context['table_info'] = table_obj
        except Table.DoesNotExist:
            messages.error(request, 'Invalid table QR code!')
            return redirect('menu')

    menu_items = menu_item.objects.filter(is_available=True).order_by('list_order')
    items_by_category = {}

    for key, group in groupby(menu_items, key=lambda x: x.category):
        items_by_category[key] = list(group)

    context['items_by_category'] = items_by_category

    return render(request, 'menu.html', context)


def all_orders(request):
    context = {}
    orders = order.objects.all().order_by('-order_time')
    order_by_table = {}

    for key, group in groupby(orders, key=lambda x: x.table):
        order_by_table[key] = list(group)

    for table, orders in order_by_table.items():
        for ord in orders:
            items_json_str = ord.items_json
            ord.items_json = json.loads(items_json_str)

    context = {'order_by_table': order_by_table}

    return render(request, 'all_orders.html', context)


def table_orders(request, table_number):
    """View orders for a specific table"""
    context = {}
    table_orders = order.objects.filter(table=table_number).order_by('-order_time')
    
    for ord in table_orders:
        items_json_str = ord.items_json
        ord.items_json = json.loads(items_json_str)
    
    context = {
        'table_orders': table_orders,
        'table_number': table_number
    }
    
    return render(request, 'table_orders.html', context)


def update_order_status(request, order_id):
    """Update order status via AJAX"""
    if request.method == 'POST' and request.user.is_authenticated:
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


def manage_tables(request):
    """Admin view to manage tables and generate QR codes"""
    if not (request.user.is_superuser or request.user.cafe_manager):
        messages.error(request, 'Access denied!')
        return redirect('menu')
    
    if request.method == 'POST':
        table_number = request.POST.get('table_number')
        table_name = request.POST.get('table_name')
        capacity = request.POST.get('capacity', 4)
        
        if Table.objects.filter(table_number=table_number).exists():
            messages.error(request, 'Table number already exists!')
        else:
            table = Table.objects.create(
                table_number=table_number,
                table_name=table_name,
                capacity=capacity
            )
            messages.success(request, f'Table {table_number} created successfully!')
            return redirect('manage_tables')
    
    tables = Table.objects.all().order_by('table_number')
    context = {'tables': tables}
    return render(request, 'manage_tables.html', context)


def delete_table(request, table_id):
    """Delete a table"""
    if not (request.user.is_superuser or request.user.cafe_manager):
        messages.error(request, 'Access denied!')
        return redirect('menu')
    
    table = get_object_or_404(Table, id=table_id)
    if request.method == 'POST':
        table.delete()
        messages.success(request, f'Table {table.table_number} deleted successfully!')
        return redirect('manage_tables')
    
    return render(request, 'delete_table.html', {'table': table})


def regenerate_qr(request, table_id):
    """Regenerate QR code for a table"""
    if not (request.user.is_superuser or request.user.cafe_manager):
        messages.error(request, 'Access denied!')
        return redirect('menu')
    
    table = get_object_or_404(Table, id=table_id)
    table.qr_code.delete(save=False)  # Delete old QR code
    table.generate_qr_code()
    table.save()
    messages.success(request, f'QR code regenerated for Table {table.table_number}!')
    return redirect('manage_tables')


def offers(request):
    return render(request, 'offers.html')


def reviews(request):

    if request.method == 'POST':
        fname = request.user.first_name
        lname = request.user.last_name
        cmt = request.POST.get('comment')
        date_today = date.today()

        review = rating(name=fname + ' ' + lname,
                        comment=cmt,
                        r_date=date_today)
        review.save()

    all_reviews = rating.objects.all().order_by('-r_date')
    context = {}
    context['reviews'] = all_reviews

    return render(request, 'reviews.html', context)


def profile(request):
    if request.user.is_anonymous:
        messages.error(request, 'Please Login first!!')
        return redirect('login')
    return render(request, 'profile.html')


def manage_menu(request):
    if request.method == 'POST' and request.FILES['img']:
        if (request.user.is_anonymous):
            messages.error(request, 'Please Login to continue!')
            return redirect('login')
        if not ((request.user.is_superuser) or (request.user.cafe_manager)):
            messages.error(request, 'Only Staff members are allowed!')
            return redirect('menu')
        else:
            name = request.POST.get('name')
            price = request.POST.get('price')
            desc = request.POST.get('desc')
            cat = request.POST.get('cat')
            img = request.FILES['img']

            if cat.lower() == 'papad':
                lising_order = 1
            elif cat.lower() == 'starter':
                listing_order = 2
            elif cat.lower() == 'bread':
                listing_order = 4
            elif cat.lower() == 'gravy':
                listing_order = 3
            elif cat.lower() == 'dal':
                listing_order = 5
            elif cat.lower() == 'rice':
                listing_order = 6
            elif cat.lower() == 'dessert':
                listing_order = 7
            elif cat.lower() == 'beverage':
                listing_order = 8

            dish = menu_item(name=name,
                             price=price,
                             desc=desc,
                             category=cat.lower(),
                             pic=img,
                             list_order=listing_order)
            dish.save()
            messages.success(request, 'Dish added successfully!')
            return redirect('menu')

    return render(
        request,
        'manage_menu.html',
    )


def delete_dish(request, item_id):

    dish = get_object_or_404(menu_item, id=item_id)
    if request.user.is_superuser:
        if request.method == 'POST':
            dish.delete()
            messages.success(request, 'Dish removed successfully!')
            return redirect('menu')
    else:
        messages.error(request, 'Only admins are allowed!')
        return redirect('menu')


def cart(request):

    if request.method == 'POST':
        if request.user.is_anonymous:
            name = 'Unknown'
            phone = 'Unknown'
        else:
            name = request.user.first_name + ' ' + request.user.last_name
            phone = request.user.phone
        items_json = request.POST.get('items_json')
        table_number = request.POST.get('table_value')
        table_unique_id = request.POST.get('table_unique_id')
        special_instructions = request.POST.get('special_instructions', '')
        total = request.POST.get('price')
        print(total)

        now = datetime.now()
        now_ist = now + timedelta(hours=5, minutes=30)

        if table_number == 'null':
            table_number = 'Take Away'

        new_order = order(name=name,
                          phone=phone,
                          items_json=items_json,
                          table=table_number,
                          table_unique_id=table_unique_id,
                          order_time=now_ist,
                          price=total,
                          special_instructions=special_instructions)
        new_order.save()

        if request.user.is_anonymous:
            messages.success(
                request,
                'Order Placed!! Thanks for ordering. You can sign up to save your information!!'
            )
            return redirect('/')
        else:

            usr = User.objects.get(phone=phone)
            usr.order_count += 1
            usr.save()
            messages.success(request, 'Order Placed!! Thanks for ordering')
            return redirect('my_orders')

    return render(request, 'cart.html')


def my_orders(request):

    phone = request.user.phone

    context = {}
    orders = order.objects.filter(phone=phone)
    order_by_table = {}

    for key, group in groupby(orders, key=lambda x: x.table):
        order_by_table[key] = list(group)
    for table, orders in order_by_table.items():
        for ord in orders:
            items_json_str = ord.items_json
            ord.items_json = json.loads(items_json_str)

    context = {'order_by_table': order_by_table}

    return render(request, 'my_orders.html', context)


def Login(request):

    if request.method == 'POST':
        phone = request.POST.get('phone')
        password = request.POST.get('password')

        user = authenticate(phone=phone, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, 'Logged in successfully !')
            return redirect('profile')

        else:
            messages.error(request, 'Login failed, Invalid Credentials!')
            return redirect('login')

    return render(request, 'login.html')


def Logout(request):
    logout(request)
    messages.success(request, 'Logged out successfully !')
    return redirect('login')


def signup(request):

    if request.method == "POST":
        fname = request.POST.get('fname')
        lname = request.POST.get('lname')
        phone = request.POST.get('number')
        pass_word = request.POST.get('password')
        c_pass_word = request.POST.get('cpassword')

        if User.objects.filter(phone=phone).exists():
            messages.error(
                request,
                'Mobile number already regestired. Please Login to continue')
            return redirect('login')

        my_user = User.objects.create_user(phone=phone, password=pass_word)
        my_user.first_name = fname
        my_user.last_name = lname
        my_user.save()
        messages.success(request, 'User created successfully !!')

        return redirect('login')

    return render(request, 'signup.html')


def generate_bill(request):
    t_number = request.GET.get('table')

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

    context = {}

    context = {
        'order_dict': order_dict,
        'bill_total': total_bill,
        'name': c_name,
        'phone': c_phone,
        'inv_id': new_bill.id,
    }
    return render(request, 'generate_bill.html', context)


def view_bills(request):

    if request.user.is_anonymous:
        messages.error(request, 'You Must be an admin user to view this!')
        return redirect('')

    all_bills = bill.objects.all().order_by('-bill_time')

    for b in all_bills:
        b.order_items = ast.literal_eval(b.order_items)

    context = {'bills': all_bills}

    return render(request, 'bills.html', context)


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


def dashboard(request):
    """Admin dashboard with order statistics"""
    if not (request.user.is_superuser or request.user.cafe_manager):
        messages.error(request, 'Access denied!')
        return redirect('menu')
    
    # Get statistics
    total_orders = order.objects.count()
    pending_orders = order.objects.filter(status='pending').count()
    today_orders = order.objects.filter(order_time__date=date.today()).count()
    total_tables = Table.objects.filter(is_active=True).count()
    
    # Recent orders
    recent_orders = order.objects.all().order_by('-order_time')[:10]
    
    context = {
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'today_orders': today_orders,
        'total_tables': total_tables,
        'recent_orders': recent_orders,
    }
    
    return render(request, 'dashboard.html', context)
