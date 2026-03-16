#!/usr/bin/env python
"""Test server simple sin cargas de modelos complejos"""

from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Iniciando servidor...")
    yield
    logger.info("🛑 Deteniendo servidor...")

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Server is running"}

@app.get("/restaurants/{restaurant_id}/image")
async def get_restaurant_image(restaurant_id: int):
    return {
        "image_base64": "test",
        "data_uri": "data:image/jpeg;base64,test"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
