from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Database models
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.models.order import Order, OrderItem

# API routers
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="StyleHub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://stylehub-fashion-store.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(payments_router)


@app.get("/")
def home():
    return {"message": "Welcome to StyleHub API"}