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
