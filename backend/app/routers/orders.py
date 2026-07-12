import random
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin
from ..config import settings

router = APIRouter(prefix="/orders", tags=["orders"])

SHIPPING_FEE = 3.99
PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify/{}"


def _serialize_order(o: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=o.id, status=o.status, subtotal=o.subtotal, shipping_fee=o.shipping_fee,
        total=o.total, address=o.address, phone=o.phone,
        payment_method=o.payment.method if o.payment else None,
        created_at=o.created_at,
        customer_name=o.user.name if o.user else None,
        items=[
            schemas.OrderItemOut(
                product_id=i.product_id,
                product_name=i.product.name if i.product else None,
                product_icon=i.product.icon if i.product else None,
                qty=i.qty, price=i.price,
            ) for i in o.items
        ],
    )


def _next_order_id(db: Session) -> str:
    last = db.query(models.Order).order_by(models.Order.created_at.desc()).first()
    if last and last.id.startswith("ORD-"):
        try:
            n = int(last.id.split("-")[1]) + 1
        except ValueError:
            n = random.randint(10000, 99999)
    else:
        n = 10001
    return f"ORD-{n}"


def _create_order_from_cart(
    db: Session, user: models.User, address: str, phone: str | None,
    payment_method: str, payment_status: str, transaction_ref: str | None = None,
) -> models.Order:
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    for ci in cart_items:
        if ci.qty > ci.product.stock:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {ci.product.name}")

    subtotal = sum(ci.product.price * ci.qty for ci in cart_items)
    total = subtotal + SHIPPING_FEE

    order = models.Order(
        id=_next_order_id(db), user_id=user.id, status="pending",
        subtotal=subtotal, shipping_fee=SHIPPING_FEE, total=total,
        address=address, phone=phone,
    )
    db.add(order)
    db.flush()

    for ci in cart_items:
        db.add(models.OrderItem(order_id=order.id, product_id=ci.product_id, qty=ci.qty, price=ci.product.price))
        ci.product.stock -= ci.qty

    db.add(models.Payment(
        order_id=order.id, method=payment_method, amount=total,
        status=payment_status, transaction_ref=transaction_ref or models.gen_uuid(),
    ))

    db.add(models.Notification(
        user_id=user.id, title="Order placed",
        body=f"{order.id} — payment via {payment_method} — ${total:.2f}",
        icon="✅",
    ))

    db.query(models.CartItem).filter(models.CartItem.user_id == user.id).delete()
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == user.id) \
        .order_by(models.Order.created_at.desc()).all()
    return [_serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    o = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not o or (o.user_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(o)


@router.post("", response_model=schemas.OrderOut)
def checkout(payload: schemas.CheckoutRequest, db: Session = Depends(get_db),
             user: models.User = Depends(get_current_user)):
    if payload.payment_method != "Cash on Delivery":
        raise HTTPException(
            status_code=400,
            detail="Card and Mobile Money payments must be confirmed via /orders/verify-payment",
        )
    order = _create_order_from_cart(
        db, user, payload.address, payload.phone, payload.payment_method, payment_status="pending",
    )
    return _serialize_order(order)


@router.post("/verify-payment", response_model=schemas.OrderOut)
def verify_payment_and_checkout(payload: schemas.PaymentVerifyRequest, db: Session = Depends(get_db),
                                 user: models.User = Depends(get_current_user)):
    if not settings.PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Payment provider is not configured on the server")

    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your cart is empty")
    expected_total = sum(ci.product.price * ci.qty for ci in cart_items) + SHIPPING_FEE

    try:
        resp = requests.get(
            PAYSTACK_VERIFY_URL.format(payload.reference),
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            timeout=15,
        )
        data = resp.json()
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach the payment provider to verify this transaction")

    if not data.get("status"):
        raise HTTPException(status_code=400, detail="Payment verification failed")

    tx = data.get("data", {})
    if tx.get("status") != "success":
        raise HTTPException(status_code=400, detail="This transaction was not completed successfully")

    paid_amount = float(tx.get("amount", 0)) / 100
    if paid_amount < expected_total - 0.01:
        raise HTTPException(status_code=400, detail="Amount paid does not match the order total")

    order = _create_order_from_cart(
        db, user, payload.address, payload.phone, payload.payment_method,
        payment_status="paid", transaction_ref=payload.reference,
    )
    return _serialize_order(order)


@router.get("/admin/all", response_model=list[schemas.OrderOut])
def admin_list_orders(db: Session = Depends(get_db), _admin: models.User = Depends(require_admin)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return [_serialize_order(o) for o in orders]


@router.put("/admin/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: str, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db),
                         _admin: models.User = Depends(require_admin)):
    o = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    valid = {"pending", "processing", "shipped", "delivered", "cancelled"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    o.status = payload.status
    db.add(models.Notification(
        user_id=o.user_id, title="Order update", body=f"{o.id} is now {payload.status}", icon="📦",
    ))
    db.commit()
    db.refresh(o)
    return _serialize_order(o)