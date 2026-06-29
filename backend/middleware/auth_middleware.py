"""
Firebase Authentication Middleware.
Verifies Firebase ID tokens on every protected request.
Extracts user UID, email, and custom claims (role: admin).
"""
import structlog
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from functools import lru_cache
from config import settings

log = structlog.get_logger()
security = HTTPBearer()


def init_firebase_app():
    """Initialize Firebase Admin SDK (idempotent)."""
    if not firebase_admin._apps:
        if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        else:
            # Use Application Default Credentials (Cloud Run environment)
            cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": settings.FIREBASE_PROJECT_ID,
        })
        log.info("Firebase Admin SDK initialized", project=settings.FIREBASE_PROJECT_ID)


init_firebase_app()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Dependency: Verify Firebase ID token and return user context.
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
            "role": decoded_token.get("role", "user"),
            "is_admin": decoded_token.get("role") == "admin",
            "is_guest": decoded_token.get("is_guest", False),
            "email_verified": decoded_token.get("email_verified", False),
        }
    except firebase_auth.RevokedIdTokenError:
        log.warning("Revoked Firebase token used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please sign in again.",
        )
    except firebase_auth.InvalidIdTokenError as e:
        log.warning("Invalid Firebase token", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )
    except Exception as e:
        log.error("Token verification failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )


async def require_admin(current_user: dict = Security(get_current_user)) -> dict:
    """
    Dependency: Require admin role (Firebase custom claim: role=admin).
    Raises 403 if user is not an admin.
    """
    if not current_user.get("is_admin"):
        log.warning(
            "Non-admin access attempt to admin route",
            uid=current_user.get("uid"),
            email=current_user.get("email"),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


async def optional_auth(
    credentials: HTTPAuthorizationCredentials = Security(HTTPBearer(auto_error=False)),
) -> dict | None:
    """
    Optional auth dependency — allows guest users (no token).
    Returns user context if authenticated, None for guests.
    """
    if not credentials:
        return None
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
            "role": decoded_token.get("role", "user"),
            "is_admin": decoded_token.get("role") == "admin",
            "is_guest": False,
        }
    except Exception:
        return None
