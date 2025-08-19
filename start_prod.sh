#!/bin/bash

echo "Starting Digital QR Restaurant Management System in Production Mode..."

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found. Using default values."
fi

# Set Django settings module for production
export DJANGO_SETTINGS_MODULE=pr1.settings_prod

# Create necessary directories
mkdir -p logs
mkdir -p staticfiles
mkdir -p media

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Start Django backend with Gunicorn (if available)
if command -v gunicorn &> /dev/null; then
    echo "Starting Django backend with Gunicorn..."
    gunicorn pr1.wsgi:application --bind 0.0.0.0:${BACKEND_PORT:-8000} --workers 3 --timeout 120 &
    DJANGO_PID=$!
else
    echo "Starting Django backend with development server..."
    python manage.py runserver 0.0.0.0:${BACKEND_PORT:-8000} &
    DJANGO_PID=$!
fi

# Wait a moment for Django to start
sleep 3

# Start React frontend (production build)
echo "Starting React frontend..."
cd frontend

# Build if build directory doesn't exist
if [ ! -d "build" ]; then
    echo "Building React frontend for production..."
    ./build-with-env.sh
fi

# Serve the build
if command -v serve &> /dev/null; then
    npx serve -s build -l ${FRONTEND_PORT:-3000} &
else
    echo "Warning: 'serve' not found. Please install it with: npm install -g serve"
    echo "Or use another static file server for the frontend build."
fi

REACT_PID=$!

echo "Services started!"
echo "Django backend: http://localhost:${BACKEND_PORT:-8000}"
echo "React frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "Django admin: http://localhost:${BACKEND_PORT:-8000}/admin"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
wait
