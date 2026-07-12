from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard(db: Session = Depends(get_db), _admin: models.User = Depends(require_admin)):
    orders = db.query(models.Order).all()
    total_sales = sum(o.total for o in orders)
    pending = len([o for o in orders if o.status == "pending"])
    customers = db.query(models.User).filter(models.User.role == "customer").count()
    low_stock = db.query(models.Product).filter(
        models.Product.stock > 0, models.Product.stock < 5
    ).count()
    return schemas.DashboardStats(
        total_sales=total_sales, total_orders=len(orders), pending_orders=pending,
        total_customers=customers, low_stock_count=low_stock,
    )


@router.get("/customers", response_model=list[schemas.CustomerReport])
def customers(db: Session = Depends(get_db), _admin: models.User = Depends(require_admin)):
    users = db.query(models.User).filter(models.User.role == "customer").all()
    out = []
    for u in users:
        orders = db.query(models.Order).filter(models.Order.user_id == u.id).all()
        out.append(schemas.CustomerReport(
            id=u.id, name=u.name, email=u.email,
            order_count=len(orders), total_spent=sum(o.total for o in orders),
        ))
    return out


@router.get("/reports/sales-by-category", response_model=list[schemas.CategorySales])
def sales_by_category(db: Session = Depends(get_db), _admin: models.User = Depends(require_admin)):
    cats = db.query(models.Category).all()
    result = []
    for c in cats:
        items = db.query(models.OrderItem).join(models.Product).filter(
            models.Product.category_id == c.id
        ).all()
        sales = sum(i.price * i.qty for i in items)
        result.append(schemas.CategorySales(category_id=c.id, category_name=c.name, icon=c.icon, sales=sales))
    return result


@router.get("/inventory", response_model=list[schemas.ProductOut])
def inventory(db: Session = Depends(get_db), _admin: models.User = Depends(require_admin)):
    from .products import _serialize
    products = db.query(models.Product).order_by(models.Product.stock.asc()).all()
    return [_serialize(p) for p in products]
