#!/usr/bin/env python3
"""
QR Code Testing Script
Tests QR code URLs and generates test URLs for manual testing
"""

import requests
import json

# Configuration - Dynamic IP detection
import socket

def get_local_ip():
    """Get the local IP address dynamically"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

# Dynamic configuration
BACKEND_URL = f"http://{get_local_ip()}:8002"
FRONTEND_URL = f"http://{get_local_ip()}:3000"

def test_backend_connectivity():
    """Test if backend is accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/menu/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is accessible")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_frontend_connectivity():
    """Test if frontend is accessible"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

def get_table_qr_urls():
    """Get table QR URLs for testing"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/tables/", timeout=5)
        if response.status_code == 200:
            tables = response.json()
            print(f"\n📋 Found {len(tables)} tables:")
            print("-" * 60)
            
            for table in tables[:5]:  # Show first 5 tables
                qr_url = f"{FRONTEND_URL}/?table={table['qr_unique_id']}"
                print(f"Table {table['table_number']}: {qr_url}")
            
            if len(tables) > 5:
                print(f"... and {len(tables) - 5} more tables")
            
            return tables
        else:
            print(f"❌ Failed to get tables: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting tables: {e}")
        return []

def get_room_qr_urls():
    """Get room QR URLs for testing"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/rooms/", timeout=5)
        if response.status_code == 200:
            rooms = response.json()
            print(f"\n🏨 Found {len(rooms)} rooms:")
            print("-" * 60)
            
            for room in rooms[:5]:  # Show first 5 rooms
                qr_url = f"{FRONTEND_URL}/?room={room['qr_unique_id']}"
                print(f"Room {room['room_number']}: {qr_url}")
            
            if len(rooms) > 5:
                print(f"... and {len(rooms) - 5} more rooms")
            
            return rooms
        else:
            print(f"❌ Failed to get rooms: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting rooms: {e}")
        return []

def main():
    print("🧪 QR Code Testing Script")
    print("=" * 50)
    
    # Test connectivity
    print("\n🔍 Testing connectivity...")
    backend_ok = test_backend_connectivity()
    frontend_ok = test_frontend_connectivity()
    
    if not backend_ok or not frontend_ok:
        print("\n❌ Cannot proceed with QR testing due to connectivity issues")
        return
    
    # Get QR URLs
    print("\n📱 QR Code URLs for testing:")
    tables = get_table_qr_urls()
    rooms = get_room_qr_urls()
    
    if tables or rooms:
        print(f"\n🎯 Manual Testing Instructions:")
        print("1. Open your mobile browser")
        print("2. Navigate to one of the URLs above")
        print("3. Test the ordering flow")
        print("4. Verify the table/room parameter is passed correctly")
        
        print(f"\n📱 Mobile Testing URLs (first table):")
        if tables:
            first_table = tables[0]
            test_url = f"{FRONTEND_URL}/?table={first_table['qr_unique_id']}"
            print(f"Table {first_table['table_number']}: {test_url}")
        
        if rooms:
            first_room = rooms[0]
            test_url = f"{FRONTEND_URL}/?room={first_room['qr_unique_id']}"
            print(f"Room {first_room['room_number']}: {test_url}")
    
    print(f"\n✅ Testing complete!")

if __name__ == "__main__":
    main()
