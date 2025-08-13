import socket
import requests
import os
from django.conf import settings

def get_local_ip():
    """Get the local IP address of the machine"""
    try:
        # Method 1: Get local IP using socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        try:
            # Method 2: Get IP from environment variable
            return os.environ.get('LOCAL_IP', '127.0.0.1')
        except Exception:
            return '127.0.0.1'

def get_frontend_url():
    """Get the frontend URL dynamically"""
    local_ip = get_local_ip()
    port = os.environ.get('FRONTEND_PORT', '3000')
    return f"http://{local_ip}:{port}"

def get_backend_url():
    """Get the backend URL dynamically"""
    local_ip = get_local_ip()
    port = os.environ.get('BACKEND_PORT', '8002')
    return f"http://{local_ip}:{port}"
