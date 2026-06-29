"""
MaMaVerse — FastAPI Backend Entry Point
AI Pregnancy & Early Parenthood Intelligence Platform
"""
import os
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from routers import auth, profile, agents, content, admin, healthcare, notifications
from middleware.auth_middleware import verify_firebase_token
from services.firestore_service import init_firestore
from config import settings

log = structlog.get_logger()

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    log.info("MaMaVerse backend starting up", version="1.0.0")
    await init_firestore()
    yield
    log.info("MaMaVerse backend shutting down")


app = FastAPI(
    title="MaMaVerse API",
    description="AI Pregnancy & Early Parenthood Intelligence Platform — Responsible AI",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENV != "production" else None,
    redoc_url="/api/redoc" if settings.ENV != "production" else None,
    lifespan=lifespan,
)

# ─── Rate Limiting ────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# ─── Security Headers Middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://apis.google.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://firebaseapp.com https://*.googleapis.com;"
    )
    return response


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(agents.router, prefix="/api/agents", tags=["AI Agents"])
app.include_router(content.router, prefix="/api/content", tags=["Knowledge Base"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(healthcare.router, prefix="/api/healthcare", tags=["Healthcare Discovery"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "MaMaVerse API", "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "MaMaVerse API",
        "description": "AI Pregnancy & Early Parenthood Intelligence Platform",
        "disclaimer": (
            "All content is for educational purposes only. "
            "Always consult a qualified healthcare professional."
        ),
    }
