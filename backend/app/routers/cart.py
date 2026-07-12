from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from .products import _serialize as serialize_product

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=list[schemas.CartItemOut])
def get_cart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
    return [schemas.CartItemOut(product_id=i.product_id, qty=i.qty, product=serialize_product(i.product))
            for i in items]


@router.post("", response_model=list[schemas.CartItemOut])
def add_to_cart(payload: schemas.CartAdd, db: Session = Depends(get_db),
                 user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user.id, models.CartItem.product_id == payload.product_id
    ).first()
    if item:
        item.qty += payload.qty
    else:
        item = models.CartItem(user_id=user.id, product_id=payload.product_id, qty=payload.qty)
        db.add(item)
    db.commit()
    return get_cart(db, user)


@router.put("/{product_id}", response_model=list[schemas.CartItemOut])
def update_cart_item(product_id: str, payload: schemas.CartUpdate, db: Session = Depends(get_db),
                      user: models.User = Depends(get_current_user)):
    item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user.id, models.CartItem.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    if payload.qty <= 0:
        db.delete(item)
    else:
        item.qty = payload.qty
    db.commit()
    return get_cart(db, user)


@router.delete("/{product_id}", response_model=list[schemas.CartItemOut])
def remove_cart_item(product_id: str, db: Session = Depends(get_db),
                      user: models.User = Depends(get_current_user)):
    item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user.id, models.CartItem.product_id == product_id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return get_cart(db, user)


@router.delete("", response_model=list[schemas.CartItemOut])
def clear_cart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db.query(models.CartItem).filter(models.CartItem.user_id == user.id).delete()
    db.commit()
    return []
