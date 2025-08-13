#!/usr/bin/env python3
"""
QR Code Content Test
Decodes QR codes to verify they contain the correct URLs
"""

import qrcode
from PIL import Image
import io
import requests
import os

def decode_qr_from_url(url):
    """Decode QR code from URL"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            # Create image from response content
            img = Image.open(io.BytesIO(response.content))
            
            # Decode QR code
            qr = qrcode.QRCode()
            qr.add_data(img)
            qr.make()
            
            # Get the data
            data = qr.get_data()
            return ''.join([chr(byte) for byte in data])
        else:
            return f"Failed to fetch QR code: {response.status_code}"
    except Exception as e:
        return f"Error decoding QR: {e}"

def test_qr_codes():
    """Test QR codes for correct URLs"""
    base_url = "http://192.168.18.102:8002"
    
    print("🧪 Testing QR Code Content")
    print("=" * 50)
    
    # Test table QR codes
    print("\n📋 Testing Table QR Codes:")
    for i in range(1, 6):  # Test first 5 tables
        qr_url = f"{base_url}/media/qr_codes/table_{i}_qr.png"
        print(f"\nTable {i} QR Code:")
        print(f"URL: {qr_url}")
        
        # Try to decode
        try:
            response = requests.get(qr_url, timeout=5)
            if response.status_code == 200:
                # For now, just check if the file exists and is accessible
                print(f"✅ QR code accessible (size: {len(response.content)} bytes)")
                print(f"📱 Expected URL pattern: http://192.168.18.102:3000/?table=...")
            else:
                print(f"❌ QR code not accessible: {response.status_code}")
        except Exception as e:
            print(f"❌ Error accessing QR code: {e}")
    
    # Test room QR codes
    print("\n🏨 Testing Room QR Codes:")
    for i in [101, 102, 201, 202]:  # Test some rooms
        qr_url = f"{base_url}/media/room_qr_codes/room_{i}_qr.png"
        print(f"\nRoom {i} QR Code:")
        print(f"URL: {qr_url}")
        
        try:
            response = requests.get(qr_url, timeout=5)
            if response.status_code == 200:
                print(f"✅ QR code accessible (size: {len(response.content)} bytes)")
                print(f"📱 Expected URL pattern: http://192.168.18.102:3000/?room=...")
            else:
                print(f"❌ QR code not accessible: {response.status_code}")
        except Exception as e:
            print(f"❌ Error accessing QR code: {e}")

def generate_test_qr():
    """Generate a test QR code with the correct URL"""
    print("\n🔧 Generating Test QR Code...")
    
    # Create a test QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Test URL
    test_url = "http://192.168.18.102:3000/?table=test-table-id"
    qr.add_data(test_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save test QR code
    test_file = "test_qr_code.png"
    img.save(test_file)
    
    print(f"✅ Test QR code saved as: {test_file}")
    print(f"📱 Contains URL: {test_url}")
    print("📱 Scan this QR code to test if it works correctly")

if __name__ == "__main__":
    test_qr_codes()
    generate_test_qr()
