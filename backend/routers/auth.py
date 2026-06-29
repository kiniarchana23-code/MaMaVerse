"""Auth router — Firebase session management and subscription."""
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user
from services.firestore_service import subscribe_user, get_user_profile, create_or_update_user
from models.schemas import NotificationSubscription

router = APIRouter()


@router.post("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify Firebase token and return user info + role."""
    profile = await get_user_profile(current_user["uid"])
    return {
        "uid": current_user["uid"],
        "email": current_user.get("email"),
        "is_admin": current_user.get("is_admin", False),
        "has_profile": profile is not None,
        "profile": profile,
    }


@router.post("/subscribe")
async def subscribe_newsletter(
    subscription: NotificationSubscription,
    current_user: dict = Depends(get_current_user),
):
    """Subscribe user to newsletter and notifications."""
    await subscribe_user(
        uid=current_user["uid"],
        email=current_user.get("email", ""),
        fcm_token=subscription.fcm_token,
    )
    await create_or_update_user(current_user["uid"], {"is_subscribed": True})
    return {"message": "Successfully subscribed to MaMaVerse updates!"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user auth context."""
    return current_user
