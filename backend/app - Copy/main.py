from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .config import settings
from .routers import auth, categories, products, cart, wishlist, orders, notifications, admin

# Create tables if they don't exist yet (use Alembic migrations for production)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="General Online Store API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(orders.router)
app.include_router(notifications.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "General Online Store API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
