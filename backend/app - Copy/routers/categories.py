from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import require_admin

router = APIRouter(prefix="/categories", tags=["categories"])


def _serialize(cat: models.Category, db: Session) -> schemas.CategoryOut:
    count = db.query(models.Product).filter(models.Product.category_id == cat.id).count()
    return schemas.CategoryOut(id=cat.id, name=cat.name, icon=cat.icon, product_count=count)


@router.get("", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(models.Category).all()
    return [_serialize(c, db) for c in cats]


@router.post("", response_model=schemas.CategoryOut)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db),
                     _admin: models.User = Depends(require_admin)):
    cat = models.Category(name=payload.name, icon=payload.icon)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _serialize(cat, db)


@router.put("/{category_id}", response_model=schemas.CategoryOut)
def update_category(category_id: str, payload: schemas.CategoryCreate, db: Session = Depends(get_db),
                     _admin: models.User = Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = payload.name
    cat.icon = payload.icon
    db.commit()
    db.refresh(cat)
    return _serialize(cat, db)


@router.delete("/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db),
                     _admin: models.User = Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    in_use = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    if in_use:
        raise HTTPException(status_code=400, detail="Move or delete products in this category first")
    db.delete(cat)
    db.commit()
    return {"ok": True}
