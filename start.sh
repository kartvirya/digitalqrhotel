#!/bin/bash

echo "Starting Digital QR Restaurant Management System..."

# Start Django backend
echo "Starting Django backend..."
cd /Users/macbook/work/digitalqr
python manage.py runserver 8000 &
DJANGO_PID=$!

# Wait a moment for Django to start
sleep 3

# Start React frontend
echo "Starting React frontend..."
cd frontend
# Use production build for better performance
if [ ! -d "build" ]; then
  echo "Building React frontend for production..."
  ./build-prod.sh
fi
npx serve -s build -l 3000 &
REACT_PID=$!

echo "Services started!"
echo "Django backend: http://localhost:8000"
echo "React frontend: http://localhost:3000"
echo "Django admin: http://localhost:8000/admin"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
wait
