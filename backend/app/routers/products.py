from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import require_admin, get_current_user

router = APIRouter(prefix="/products", tags=["products"])


def _serialize(p: models.Product) -> schemas.ProductOut:
    return schemas.ProductOut(
        id=p.id, name=p.name, category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        icon=p.icon, price=p.price, old_price=p.old_price, stock=p.stock,
        rating=p.rating, reviews_count=p.reviews_count, is_deal=p.is_deal,
        description=p.description or "",
    )


@router.get("", response_model=list[schemas.ProductOut])
def list_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    deals_only: bool = False,
    db: Session = Depends(get_db),
):
    q = db.query(models.Product)
    if category_id:
        q = q.filter(models.Product.category_id == category_id)
    if search:
        q = q.filter(models.Product.name.ilike(f"%{search}%"))
    if deals_only:
        q = q.filter(models.Product.is_deal == True)  # noqa: E712
    return [_serialize(p) for p in q.all()]


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize(p)


@router.post("", response_model=schemas.ProductOut)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db),
                    _admin: models.User = Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == payload.category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Category does not exist")
    p = models.Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _serialize(p)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: str, payload: schemas.ProductUpdate, db: Session = Depends(get_db),
                    _admin: models.User = Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return _serialize(p)


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db),
                    _admin: models.User = Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


# ---------- Reviews ----------
@router.get("/{product_id}/reviews", response_model=list[schemas.ReviewOut])
def list_reviews(product_id: str, db: Session = Depends(get_db)):
    revs = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    return [
        schemas.ReviewOut(id=r.id, stars=r.stars, text=r.text,
                           user_name=r.user.name if r.user else "Anonymous",
                           created_at=r.created_at)
        for r in revs
    ]


@router.post("/{product_id}/reviews", response_model=schemas.ReviewOut)
def add_review(product_id: str, payload: schemas.ReviewCreate, db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    review = models.Review(product_id=product_id, user_id=user.id, stars=payload.stars, text=payload.text)
    db.add(review)
    db.flush()

    all_reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    p.reviews_count = len(all_reviews)
    p.rating = round(sum(r.stars for r in all_reviews) / len(all_reviews), 1)

    db.commit()
    db.refresh(review)
    return schemas.ReviewOut(id=review.id, stars=review.stars, text=review.text,
                              user_name=user.name, created_at=review.created_at)
