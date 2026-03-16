#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test predicción de servicios"""

import requests
import json

payload = {
    "service_date": "2026-03-19",
    "restaurant_id": 5,
    "is_stadium_event": False,
    "is_azca_event": False,
    "capacity_limit": 57,
    "table_count": 28,
    "min_service_duration": 60,
    "terrace_setup_type": "none",
    "opens_weekends": False,
    "has_wifi": True,
    "restaurant_segment": "Gourmet",
    "menu_price": 41.17,
    "dist_office_towers": 141,
    "google_rating": 4.2,
    "cuisine_type": "Italian"
}

try:
    print("🚀 Enviando predicción de servicios...")
    resp = requests.post("http://localhost:8000/predict", json=payload, timeout=10)
    print(f"✅ Status: {resp.status_code}")
    print(f"Response:")
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print(f"❌ Error: {e}")
