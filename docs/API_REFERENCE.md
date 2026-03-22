# API Reference

## REST API Documentation

All endpoints require JSON content-type and return JSON responses.

**Base URL:** `http://localhost:8000` (development)

---

## Authentication

Currently no authentication (development mode).

**Future:** Azure AD integration will require bearer token:

```
Authorization: Bearer <token>
```

---

## Health Check

### GET /health

Check if API is alive and responsive.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-22T14:30:00Z"
}
```

**Use Case:** Load balancer health probes, uptime monitoring

---

## Restaurants

### GET /restaurants

List all restaurants available in the system.

**Response:**

```json
{
  "restaurants": [
    {
      "restaurant_id": 1,
      "name": "Tapas Bar Azca",
      "cuisine_type": "spanish",
      "segment": "casual",
      "google_rating": 4.7,
      "capacity": 80
    },
    {
      "restaurant_id": 2,
      "name": "Fine Dining French",
      "cuisine_type": "french",
      "segment": "fine_dining",
      "google_rating": 4.9,
      "capacity": 120
    }
  ]
}
```

---

### GET /restaurants/{id}

Get detailed information for a specific restaurant.

**Parameters:**

- `id` (path): Restaurant ID

**Response:**

```json
{
  "restaurant_id": 1,
  "name": "Tapas Bar Azca",
  "cuisine_type": "spanish",
  "segment": "casual",
  "capacity_limit": 80,
  "table_count": 12,
  "min_service_duration": 45,
  "terrace_setup": "outdoor",
  "opens_weekends": true,
  "has_wifi": true,
  "menu_price": 28.5,
  "google_rating": 4.7,
  "dist_office_towers": 250,
  "location_lat": 40.4515,
  "location_lon": -3.6918
}
```

**Error:**

```json
{
  "error": "Restaurant not found",
  "status": 404
}
```

---

## Predictions

### POST /predict/service

Predict daily service volume (number of meals served).

**Request Body:**

```json
{
  "restaurant_id": 1,
  "date": "2026-04-01"
}
```

**Required Fields:**

- `restaurant_id` (integer): Valid restaurant ID
- `date` (string): ISO format date (YYYY-MM-DD), must be future or today

**Optional Fields:**

- `capacity_override` (integer): Override restaurant capacity
- `use_cache` (boolean): Use cached weather data (default: true)

**Response (Success):**

```json
{
  "prediction_id": "pred_12345",
  "restaurant_id": 1,
  "prediction_date": "2026-04-01",
  "predicted_services": 95,
  "predicted_covers": 285,
  "confidence": 0.87,
  "confidence_interval": {
    "lower_95": 78,
    "upper_95": 112
  },
  "factors": {
    "historical_baseline": 85,
    "weather_factor": 1.05,
    "calendar_factor": 1.08,
    "location_factor": 0.98,
    "restaurant_capacity_factor": 1.0
  },
  "model_version": "2.1",
  "execution_time_ms": 342,
  "timestamp": "2026-03-22T14:30:00Z"
}
```

**Response (Error):**

```json
{
  "error": "Invalid date format",
  "detail": "Date must be YYYY-MM-DD format",
  "status": 400
}
```

**Error Codes:**
| Status | Meaning | Example |
|--------|---------|---------|
| 400 | Bad request (validation) | Invalid date format |
| 404 | Restaurant not found | restaurant_id doesn't exist |
| 500 | Server error (model failed) | XGBoost inference crashed |

---

### POST /predict/menu

Predict top-performing dishes for a specific date.

**Request Body:**

```json
{
  "restaurant_id": 1,
  "date": "2026-04-01"
}
```

**Response:**

```json
{
  "prediction_id": "pred_12346",
  "restaurant_id": 1,
  "prediction_date": "2026-04-01",
  "top_3_dishes": [
    {
      "rank": 1,
      "name": "Salmon with Dill Sauce",
      "confidence": 0.92,
      "reason": "High demand + historical success",
      "estimated_orders": 28
    },
    {
      "rank": 2,
      "name": "Pasta Carbonara",
      "confidence": 0.88,
      "reason": "Temperature forecast supports Italian",
      "estimated_orders": 23
    },
    {
      "rank": 3,
      "name": "Tiramisu",
      "confidence": 0.85,
      "reason": "Top dessert across similar days",
      "estimated_orders": 18
    }
  ],
  "model_version": "1.2",
  "timestamp": "2026-03-22T14:30:00Z"
}
```

---

## Feedback

### POST /feedback/{prediction_id}

Submit user feedback on a prediction (helps improve models).

**Parameters:**

- `prediction_id` (path): Prediction ID from prediction response

**Request Body:**

```json
{
  "rating": "good",
  "notes": "Prediction was very accurate"
}
```

**Rating Values:**

- `good` - Prediction was helpful and accurate
- `ok` - Prediction was partially helpful
- `bad` - Prediction was incorrect
- `skip` - User didn't find it useful

**Response:**

```json
{
  "feedback_id": "fb_98765",
  "prediction_id": "pred_12345",
  "rating": "good",
  "created_at": "2026-03-22T14:35:00Z"
}
```

---

## Models

### GET /models/status

Get current model versions and training status.

**Response:**

```json
{
  "models": {
    "service_prediction": {
      "version": "2.1",
      "trained_date": "2026-03-15",
      "next_training": "2026-04-01T06:00:00Z",
      "performance": {
        "mae": 8.5,
        "mape": 5.2,
        "r2_score": 0.89
      }
    },
    "menu_prediction": {
      "version": "1.2",
      "trained_date": "2026-03-10",
      "next_training": "2026-04-10T06:00:00Z",
      "performance": {
        "top1_accuracy": 0.87,
        "top3_accuracy": 0.94
      }
    }
  },
  "last_refresh": "2026-03-22T10:00:00Z"
}
```

---

### POST /models/retrain (Admin Only)

Manually trigger model retraining (normally monthly).

**Request Body:**

```json
{
  "force": true
}
```

**Response:**

```json
{
  "job_id": "job_67890",
  "status": "queued",
  "expected_duration_minutes": 8,
  "message": "Retraining job submitted to Azure ML"
}
```

---

## Batch Predictions (Future)

### POST /predict/batch

Predict for multiple restaurants/dates in one request.

**Request Body:**

```json
{
  "predictions": [
    { "restaurant_id": 1, "date": "2026-04-01" },
    { "restaurant_id": 1, "date": "2026-04-02" },
    { "restaurant_id": 2, "date": "2026-04-01" }
  ]
}
```

**Response:**

```json
{
  "batch_id": "batch_12345",
  "predictions": [
    // ... array of prediction objects ...
  ],
  "total_time_ms": 1200,
  "succeeded": 3,
  "failed": 0
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Validation error",
  "detail": "More specific error message",
  "status": 400,
  "timestamp": "2026-03-22T14:30:00Z"
}
```

### Common HTTP Status Codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 200  | Success                          |
| 400  | Bad request (client error)       |
| 404  | Not found                        |
| 429  | Too many requests (rate limited) |
| 500  | Internal server error            |
| 503  | Service unavailable              |

---

## Rate Limiting

**Limits (future):**

- 100 requests per minute per IP
- 1000 requests per hour per API key

**Headers Returned:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1648003200
```

---

## Caching

**Cache Headers:**

```
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Mon, 22 Mar 2026 12:00:00 GMT
```

---

## OpenAPI / Swagger

Interactive API documentation available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## Response Times

**Expected latency:**

- Simple request (cached): 300-400ms
- Fresh weather fetch: 600-800ms
- Database error/retry: 1500-3000ms

---

## Webhooks (Future)

Subscribe to prediction events:

```json
POST /webhooks/subscribe
{
  "url": "https://your-app.com/webhook",
  "events": ["prediction.created", "feedback.submitted"],
  "restaurant_ids": [1, 2, 3]
}
```

---

## Code Examples

### Python (Requests)

```python
import requests

# Get restaurants
response = requests.get("http://localhost:8000/restaurants")
restaurants = response.json()

# Make prediction
prediction = requests.post(
    "http://localhost:8000/predict/service",
    json={
        "restaurant_id": 1,
        "date": "2026-04-01"
    }
)
result = prediction.json()
print(f"Predicted services: {result['predicted_services']}")

# Submit feedback
feedback = requests.post(
    f"http://localhost:8000/feedback/{result['prediction_id']}",
    json={"rating": "good"}
)
```

### JavaScript (Axios)

```javascript
import axios from "axios";

const API_URL = "http://localhost:8000";

// Get restaurants
const restaurants = await axios.get(`${API_URL}/restaurants`);

// Make prediction
const prediction = await axios.post(`${API_URL}/predict/service`, {
  restaurant_id: 1,
  date: "2026-04-01",
});

console.log(`Predicted: ${prediction.data.predicted_services} services`);

// Submit feedback
await axios.post(`${API_URL}/feedback/${prediction.data.prediction_id}`, {
  rating: "good",
});
```

### cURL

```bash
# Get restaurants
curl http://localhost:8000/restaurants

# Make prediction
curl -X POST http://localhost:8000/predict/service \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": 1,
    "date": "2026-04-01"
  }'

# Submit feedback
curl -X POST http://localhost:8000/feedback/pred_12345 \
  -H "Content-Type: application/json" \
  -d '{"rating": "good"}'
```

---

**Last Updated:** March 2026  
**Version:** 1.0

See [README.md](../README.md) for full documentation.
