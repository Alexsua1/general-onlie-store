from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CategoryBase(BaseModel):
    name: str
    icon: str = "TAG"


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_count: Optional[int] = 0


class ProductBase(BaseModel):
    name: str
    category_id: str
    icon: str = "ITEM"
    image_url: Optional[str] = None
    price: float
    old_price: Optional[float] = None
    stock: int = 0
    is_deal: bool = False
    description: str = ""


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    icon: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    stock: Optional[int] = None
    is_deal: Optional[bool] = None
    description: Optional[str] = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    category_id: str
    category_name: Optional[str] = None
    icon: str
    image_url: Optional[str] = None
    price: float
    old_price: Optional[float]
    stock: int
    rating: float
    reviews_count: int
    is_deal: bool
    description: str


class ReviewCreate(BaseModel):
    stars: int
    text: str = ""


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    stars: int
    text: str
    user_name: Optional[str] = None
    created_at: datetime


class CartAdd(BaseModel):
    product_id: str
    qty: int = 1


class CartUpdate(BaseModel):
    qty: int


class CartItemOut(BaseModel):
    product_id: str
    qty: int
    product: ProductOut


class WishlistAdd(BaseModel):
    product_id: str


class CheckoutRequest(BaseModel):
    address: str
    phone: Optional[str] = None
    payment_method: str


class PaymentVerifyRequest(BaseModel):
    reference: str
    address: str
    phone: Optional[str] = None
    payment_method: str


class OrderItemOut(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    product_icon: Optional[str] = None
    qty: int
    price: float


class OrderOut(BaseModel):
    id: str
    status: str
    subtotal: float
    shipping_fee: float
    total: float
    address: str
    phone: Optional[str]
    payment_method: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []
    customer_name: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    body: str
    icon: str
    is_read: bool
    created_at: datetime


class DashboardStats(BaseModel):
    total_sales: float
    total_orders: int
    pending_orders: int
    total_customers: int
    low_stock_count: int


class CustomerReport(BaseModel):
    id: str
    name: str
    email: str
    order_count: int
    total_spent: float


class CategorySales(BaseModel):
    category_id: str
    category_name: str
    icon: str
    sales: float
