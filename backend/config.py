"""
Application configuration using pydantic-settings.
All secrets loaded from environment variables / Google Secret Manager.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    ENV: str = "development"
    APP_NAME: str = "MaMaVerse"
    SECRET_KEY: str = "change-me-in-production"

    # GCP
    GCP_PROJECT_ID: str = "project-7e1f15c5-7bea-42ce-ad3"
    GCP_REGION: str = "asia-south1"

    # Firebase
    FIREBASE_PROJECT_ID: str = "project-7e1f15c5-7bea-42ce-ad3"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ""  # Set in production via Secret Manager

    # Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_PRO_MODEL: str = "gemini-1.5-pro"

    # Firestore
    FIRESTORE_DATABASE: str = "(default)"

    # Google Places API (Healthcare Discovery)
    GOOGLE_PLACES_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://mamaverse.web.app",
        "https://mamaverse-frontend-*.run.app",
    ]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AGENT_PER_MINUTE: int = 20

    # Medical Disclaimer (always shown)
    MEDICAL_DISCLAIMER: str = (
        "⚠️ DISCLAIMER: All content on MaMaVerse is for educational and "
        "informational purposes only. It does not constitute medical advice, "
        "diagnosis, or treatment. Always consult a qualified healthcare "
        "professional for medical decisions."
    )

    # Admin
    ADMIN_EMAIL_WHITELIST: List[str] = []  # Backup — primary method is Firebase custom claim

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
