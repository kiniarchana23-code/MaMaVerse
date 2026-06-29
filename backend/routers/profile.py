"""
Profile router — user profile creation and management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from middleware.auth_middleware import get_current_user, optional_auth
from models.schemas import UserProfileCreate, UserProfileUpdate
from services.firestore_service import create_or_update_user, get_user_profile, delete_user_data
from config import settings

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: UserProfileCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create or update user profile after onboarding."""
    uid = current_user["uid"]

    # Calculate trimester
    trimester = None
    if data.pregnancy_week:
        if data.pregnancy_week <= 12:
            trimester = "first"
        elif data.pregnancy_week <= 26:
            trimester = "second"
        else:
            trimester = "third"

    # Calculate baby age in months from birth date
    baby_age_months = None
    if data.baby_birth_date:
        try:
            from datetime import date
            birth = date.fromisoformat(data.baby_birth_date)
            today = date.today()
            baby_age_months = (today.year - birth.year) * 12 + (today.month - birth.month)
        except ValueError:
            pass

    profile_data = {
        "uid": uid,
        "email": current_user.get("email", ""),
        "user_type": data.user_type,
        "pregnancy_week": data.pregnancy_week,
        "trimester": trimester,
        "due_date": data.due_date,
        "baby_birth_date": data.baby_birth_date,
        "baby_age_months": baby_age_months,
        "city": data.city,
        "state": data.state,
        "is_subscribed": data.is_subscribed,
        "dietary_preference": data.dietary_preference or "vegetarian",
        "country": "India",
    }

    saved = await create_or_update_user(uid, profile_data)
    return {"message": "Profile saved successfully", "profile": saved}


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    profile = await get_user_profile(current_user["uid"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    return profile


@router.patch("/me")
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update user profile fields."""
    update_data = data.model_dump(exclude_none=True)
    saved = await create_or_update_user(current_user["uid"], update_data)
    return {"message": "Profile updated", "profile": saved}


@router.delete("/me")
async def delete_my_profile(current_user: dict = Depends(get_current_user)):
    """GDPR: Delete all user data permanently."""
    await delete_user_data(current_user["uid"])
    return {"message": "Your data has been permanently deleted."}
