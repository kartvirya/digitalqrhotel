#!/bin/bash

echo "🚀 Starting Food Ordering System for Network Access..."
echo ""

# Get the local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📍 Your local IP address: $LOCAL_IP"
echo ""

# Kill any existing processes
echo "🛑 Stopping existing servers..."
pkill -f "python manage.py runserver" 2>/dev/null
pkill -f "npm start" 2>/dev/null
sleep 2

# Start Django backend
echo "🔧 Starting Django Backend..."
cd /Users/macbook/work/Order-food-using-QR_code
python manage.py runserver 0.0.0.0:8002 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React Frontend..."
cd /Users/macbook/work/Order-food-using-QR_code/frontend
HOST=0.0.0.0 npm start &
FRONTEND_PID=$!

# Wait for both servers to start
sleep 10

echo ""
echo "✅ Servers are running!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend API: http://$LOCAL_IP:8002"
echo "   Admin Panel: http://$LOCAL_IP:8002/admin"
echo ""
echo "📱 You can now access the application from:"
echo "   - Your mobile device"
echo "   - Other computers on the same network"
echo "   - Any device connected to your WiFi"
echo ""
echo "🔗 QR Code URLs will work on any device:"
echo "   http://$LOCAL_IP:3000/?table=TABLE_UNIQUE_ID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
