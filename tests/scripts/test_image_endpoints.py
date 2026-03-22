#!/usr/bin/env python
"""Test script for Base64 image endpoints."""

import requests
import base64
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# URLs
BASE_URL = "http://localhost:8000"
RESTAURANT_ID = 1

# Admin token (puede ser cualquier token valid)
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwicmVzdGF1cmFudF9pZCI6MCwiaWF0IjoxNjk5NDIwODAwfQ.test"

# Restaurant token
RESTAURANT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF6Y2FwcmltZWdyaWxsIiwicm9sZSI6InJlc3RhdXJhbnRfb3duZXIiLCJyZXN0YXVyYW50X2lkIjoxLCJpYXQiOjE2OTk0MjA4MDB9.test"

def test_image_upload():
    """Test PATCH /restaurants/{id}/image with file upload."""
    print(f"\nTest: Upload image to restaurant {RESTAURANT_ID}")
    
    # Create a simple test image
    image_path = PROJECT_ROOT / "tests" / "assets" / "test_image.png"
    
    # If missing, download a small placeholder image
    if not image_path.exists():
        print(f"  Not found {image_path}, downloading test image...")
        try:
            response = requests.get("https://placehold.co/200x200.png")
            with open(image_path, "wb") as f:
                f.write(response.content)
        except Exception as e:
            print(f"  �O Error downloading image: {e}")
            return False
    
    try:
        with open(image_path, "rb") as f:
            files = {"image_file": (image_path.name, f, "image/png")}
            headers = {"Authorization": f"Bearer {RESTAURANT_TOKEN}"}
            
            response = requests.patch(
                f"{BASE_URL}/restaurants/{RESTAURANT_ID}/image",
                files=files,
                headers=headers
            )
        
        if response.status_code == 200:
            data = response.json()
            print("  Image uploaded successfully")
            print(f"     - Base64 length: {len(data['image_base64'])} chars")
            print(f"     - Content-Type: {data['content_type']}")
            return True
        else:
            print(f"  �O Error: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
    except Exception as e:
        print(f"  �O Error: {e}")
        return False

def test_image_retrieve():
    """Test GET /restaurants/{id}/image."""
    print(f"\nTest: Retrieve image for restaurant {RESTAURANT_ID}")
    
    try:
        response = requests.get(f"{BASE_URL}/restaurants/{RESTAURANT_ID}/image")
        
        if response.status_code == 200:
            data = response.json()
            print("  Image retrieved successfully")
            print(f"     - Base64 length: {len(data['image_base64'])} chars")
            print(f"     - Data URI starts with: {data['data_uri'][:50]}...")
            
            # Verify base64 decoding works
            try:
                image_data = base64.b64decode(data['image_base64'])
                print(f"     - Decoded size: {len(image_data)} bytes")
            except Exception as e:
                print(f"     �O Error decoding Base64: {e}")
                return False
            
            return True
        elif response.status_code == 404:
            print("  No image found (expected on first run)")
            return True
        else:
            print(f"  �O Error: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
    except Exception as e:
        print(f"  �O Error: {e}")
        return False

def main():
    print("Base64 image endpoint tests")
    print("=" * 50)
    
    # Test 1: Upload image
    upload_ok = test_image_upload()
    
    # Test 2: Retrieve image
    retrieve_ok = test_image_retrieve()
    
    print("\n" + "=" * 50)
    if upload_ok and retrieve_ok:
        print("All tests passed")
        return 0
    else:
        print("Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())



