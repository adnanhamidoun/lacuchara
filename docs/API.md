# API Guide

The backend API is implemented in `backend/api/main.py`.

## Core Endpoints

- `GET /health` - Service health probe.
- `GET /restaurants` - List restaurants.
- `GET /restaurants/{restaurant_id}` - Restaurant details.
- `GET /restaurants/{restaurant_id}/menu/today` - Current daily menu.
- `POST /predict` - Demand prediction endpoint.

## Interactive Docs

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Error Model

Most business and runtime errors are returned as HTTPException with:

- HTTP status code
- `detail` message

## Notes

- OCR-related endpoints require Azure Document Intelligence dependencies.
- Date-sensitive endpoints use local service-date resolution when timezone data is unavailable.
