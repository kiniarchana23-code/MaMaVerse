"""
Pydantic models for MaMaVerse data structures.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserType(str, Enum):
    PREGNANT = "pregnant"
    NEW_MOM = "new_mom"


class ContentStatus(str, Enum):
    PENDING = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"


class ContentCategory(str, Enum):
    PREGNANCY = "pregnancy"
    NEWBORN = "newborn"
    NUTRITION = "nutrition"
    WELLNESS = "wellness"
    BREASTFEEDING = "breastfeeding"
    MILESTONES = "milestones"
    MEDICAL_TESTS = "medical_tests"
    HEALTHCARE = "healthcare"
    GENERAL = "general"


class Trimester(str, Enum):
    FIRST = "first"    # weeks 1-12
    SECOND = "second"  # weeks 13-26
    THIRD = "third"    # weeks 27-40


# ─── User Profile ─────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    user_type: UserType
    is_subscribed: bool = False

    # Pregnant fields
    pregnancy_week: Optional[int] = Field(None, ge=1, le=42)
    due_date: Optional[str] = None
    trimester: Optional[Trimester] = None

    # New mom fields
    baby_birth_date: Optional[str] = None
    baby_age_months: Optional[int] = Field(None, ge=0, le=36)

    # Preferences
    city: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    country: str = "India"
    language: str = "en"
    dietary_preference: Optional[Literal["vegetarian", "non_vegetarian", "vegan"]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserProfileCreate(BaseModel):
    user_type: UserType
    pregnancy_week: Optional[int] = Field(None, ge=1, le=42)
    due_date: Optional[str] = None
    baby_birth_date: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_subscribed: bool = False
    dietary_preference: Optional[Literal["vegetarian", "non_vegetarian", "vegan"]] = None


class UserProfileUpdate(BaseModel):
    pregnancy_week: Optional[int] = Field(None, ge=1, le=42)
    baby_age_months: Optional[int] = Field(None, ge=0, le=36)
    city: Optional[str] = None
    dietary_preference: Optional[Literal["vegetarian", "non_vegetarian", "vegan"]] = None
    is_subscribed: Optional[bool] = None


# ─── Knowledge Base / Content ──────────────────────────────────────────────────

class KnowledgeArticle(BaseModel):
    id: Optional[str] = None
    title: str
    summary: str
    full_content: str
    source_url: str
    source_name: str  # WHO, NHS, ICMR, etc.
    category: ContentCategory
    tags: List[str] = []
    pregnancy_weeks: Optional[List[int]] = None  # Relevant pregnancy weeks
    baby_age_months: Optional[List[int]] = None  # Relevant baby age months
    ai_confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    status: ContentStatus = ContentStatus.PENDING
    admin_notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None  # Admin UID
    published_at: Optional[datetime] = None
    disclaimer: str = (
        "This content is for educational purposes only. "
        "Always consult your healthcare provider."
    )


class ArticleReviewAction(BaseModel):
    action: Literal["approve", "reject"]
    admin_notes: Optional[str] = None


# ─── AI Agent Requests ────────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    agent_type: Literal[
        "pregnancy", "newmom", "nutrition",
        "wellness", "healthcare", "general"
    ] = "general"
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    response: str
    sources: List[str] = []
    disclaimer: str = (
        "This content is for educational purposes only. "
        "Always consult a qualified healthcare professional."
    )
    agent_type: str
    confidence: Optional[float] = None


# ─── Healthcare ───────────────────────────────────────────────────────────────

class HealthcareSearchRequest(BaseModel):
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    specialty: Optional[str] = "gynecologist"
    radius_km: int = Field(10, ge=1, le=50)


class HealthcareFacility(BaseModel):
    name: str
    address: str
    specialty: str
    phone: Optional[str] = None
    rating: Optional[float] = None
    distance_km: Optional[float] = None
    google_maps_url: Optional[str] = None


# ─── Notifications ─────────────────────────────────────────────────────────────

class NotificationSubscription(BaseModel):
    fcm_token: str
    topics: List[str] = ["general"]


class NotificationPayload(BaseModel):
    title: str
    body: str
    topic: Optional[str] = None
    uid: Optional[str] = None


# ─── Admin Content Ingestion ───────────────────────────────────────────────────

class ContentIngestionRequest(BaseModel):
    source_url: str
    category: ContentCategory
    notes: Optional[str] = None


class AdminStats(BaseModel):
    pending_count: int
    approved_count: int
    rejected_count: int
    published_count: int
    total_users: int
    total_articles: int
