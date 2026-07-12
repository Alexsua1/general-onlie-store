from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items = db.query(models.Notification).filter(models.Notification.user_id == user.id) \
        .order_by(models.Notification.created_at.desc()).all()
    return items


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user.id, models.Notification.is_read == False  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
