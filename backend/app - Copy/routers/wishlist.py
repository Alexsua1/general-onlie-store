from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from .products import _serialize as serialize_product

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[schemas.ProductOut])
def get_wishlist(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items = db.query(models.WishlistItem).filter(models.WishlistItem.user_id == user.id).all()
    return [serialize_product(i.product) for i in items]


@router.post("", response_model=list[schemas.ProductOut])
def add_wishlist(payload: schemas.WishlistAdd, db: Session = Depends(get_db),
                  user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    exists = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user.id, models.WishlistItem.product_id == payload.product_id
    ).first()
    if not exists:
        db.add(models.WishlistItem(user_id=user.id, product_id=payload.product_id))
        db.commit()
    return get_wishlist(db, user)


@router.delete("/{product_id}", response_model=list[schemas.ProductOut])
def remove_wishlist(product_id: str, db: Session = Depends(get_db),
                     user: models.User = Depends(get_current_user)):
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user.id, models.WishlistItem.product_id == product_id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return get_wishlist(db, user)
