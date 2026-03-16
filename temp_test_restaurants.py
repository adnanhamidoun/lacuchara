import asyncio

from backend.api.main import get_restaurants
from backend.db.database import SessionLocal

async def main():
    db = SessionLocal()
    try:
        res = await get_restaurants(db=db)
        print('OK', res)
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(main())
