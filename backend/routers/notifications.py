"""Notifications router — FCM push notification management."""
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user, require_admin
from models.schemas import NotificationSubscription, NotificationPayload
from services.firestore_service import subscribe_user
import firebase_admin
from firebase_admin import messaging
import structlog

router = APIRouter()
log = structlog.get_logger()


@router.post("/register-token")
async def register_fcm_token(
    subscription: NotificationSubscription,
    current_user: dict = Depends(get_current_user),
):
    """Register device FCM token for push notifications."""
    await subscribe_user(
        uid=current_user["uid"],
        email=current_user.get("email", ""),
        fcm_token=subscription.fcm_token,
    )
    return {"message": "Device registered for notifications"}


@router.post("/send", status_code=202)
async def send_notification(
    payload: NotificationPayload,
    admin: dict = Depends(require_admin),
):
    """Admin: Send push notification to a topic or specific user."""
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=payload.title,
                body=payload.body,
            ),
            topic=payload.topic or "general",
        )
        response = messaging.send(message)
        log.info("Notification sent", message_id=response)
        return {"message": "Notification sent", "message_id": response}
    except Exception as e:
        log.error("Notification send failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")
