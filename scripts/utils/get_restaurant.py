import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import SessionLocal
from backend.db.models import Restaurant

db = SessionLocal()
restaurants = db.query(Restaurant).limit(1).all()
if restaurants:
    print(f"Restaurant ID: {restaurants[0].restaurant_id}")
    print(f"Restaurant Name: {restaurants[0].name}")
else:
    print("No restaurants found")
db.close()
