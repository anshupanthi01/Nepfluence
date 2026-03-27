# backend/main.py
from fastapi import FastAPI
from database import test_connection
app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "Backend is running with uv!"}

test_connection()