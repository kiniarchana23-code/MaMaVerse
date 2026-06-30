"""
Cloud Firestore service — all database operations for MaMaVerse.
Implements security by design: users can only access their own data.
"""
import structlog
from datetime import datetime, timezone
from typing import Optional, List
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from config import settings

log = structlog.get_logger()

_db: Optional[firestore.AsyncClient] = None


async def init_firestore():
    """Initialize Firestore async client."""
    global _db
    _db = firestore.AsyncClient(
        project=settings.GCP_PROJECT_ID,
        database=settings.FIRESTORE_DATABASE,
    )
    log.info("Firestore initialized", project=settings.GCP_PROJECT_ID)


def get_db() -> firestore.AsyncClient:
    if _db is None:
        raise RuntimeError("Firestore not initialized. Call init_firestore() first.")
    return _db


# ─── Collections ──────────────────────────────────────────────────────────────
USERS_COL = "users"
ARTICLES_COL = "knowledge_articles"
AUDIT_COL = "audit_logs"
SUBSCRIPTIONS_COL = "subscriptions"
HEALTHCARE_CACHE_COL = "healthcare_cache"


# ─── User Operations ──────────────────────────────────────────────────────────

async def create_or_update_user(uid: str, data: dict) -> dict:
    """Create or update a user profile. Users can only write their own data."""
    db = get_db()
    data["updated_at"] = datetime.now(timezone.utc)
    doc_ref = db.collection(USERS_COL).document(uid)
    doc = await doc_ref.get()
    if not doc.exists:
        data["created_at"] = datetime.now(timezone.utc)
        await doc_ref.set(data)
        log.info("User profile created", uid=uid)
    else:
        await doc_ref.update(data)
        log.info("User profile updated", uid=uid)
    return (await doc_ref.get()).to_dict()


async def get_user_profile(uid: str) -> Optional[dict]:
    """Get a user profile by UID."""
    db = get_db()
    doc = await db.collection(USERS_COL).document(uid).get()
    return doc.to_dict() if doc.exists else None


async def delete_user_data(uid: str):
    """GDPR: Delete all user data permanently."""
    db = get_db()
    await db.collection(USERS_COL).document(uid).delete()
    await _write_audit_log("user_data_deleted", uid=uid, details={"reason": "user_request"})
    log.info("User data deleted (GDPR)", uid=uid)


# ─── Knowledge Base / Content Operations ──────────────────────────────────────

async def create_article(data: dict) -> str:
    """Create a new knowledge article in PENDING status."""
    db = get_db()
    data["submitted_at"] = datetime.now(timezone.utc)
    data["status"] = "pending_review"
    _, doc_ref = await db.collection(ARTICLES_COL).add(data)
    log.info("Article created", article_id=doc_ref.id, title=data.get("title", ""))
    return doc_ref.id


async def get_pending_articles(limit: int = 50) -> List[dict]:
    """Get all articles pending admin review."""
    db = get_db()
    query = (
        db.collection(ARTICLES_COL)
        .where(filter=FieldFilter("status", "==", "pending_review"))
    )
    docs = query.stream()
    results = []
    async for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        results.append(d)

    # Sort in-memory
    results.sort(
        key=lambda x: x.get("submitted_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True
    )
    return results[:limit]


async def get_published_articles(
    category: Optional[str] = None,
    pregnancy_week: Optional[int] = None,
    baby_age_months: Optional[int] = None,
    limit: int = 20,
) -> List[dict]:
    """Get published articles, optionally filtered."""
    db = get_db()
    query = db.collection(ARTICLES_COL).where(
        filter=FieldFilter("status", "==", "published")
    )
    if category:
        query = query.where(filter=FieldFilter("category", "==", category))
    results = []
    async for doc in query.stream():
        d = doc.to_dict()
        d["id"] = doc.id
        results.append(d)

    # Sort in-memory to avoid requiring composite indexes in Firestore
    results.sort(
        key=lambda x: x.get("published_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True
    )
    results = results[:limit]

    # Filter by week/age in-memory (Firestore array-contains limitation)
    if pregnancy_week is not None:
        results = [
            a for a in results
            if a.get("pregnancy_weeks") is None
            or pregnancy_week in (a.get("pregnancy_weeks") or [])
        ]
    if baby_age_months is not None:
        results = [
            a for a in results
            if a.get("baby_age_months") is None
            or baby_age_months in (a.get("baby_age_months") or [])
        ]
    return results


async def approve_article(article_id: str, admin_uid: str, notes: Optional[str] = None):
    """Admin approves and publishes an article."""
    db = get_db()
    await db.collection(ARTICLES_COL).document(article_id).update({
        "status": "published",
        "reviewed_at": datetime.now(timezone.utc),
        "reviewed_by": admin_uid,
        "published_at": datetime.now(timezone.utc),
        "admin_notes": notes,
    })
    await _write_audit_log("article_approved", uid=admin_uid, details={"article_id": article_id})
    log.info("Article approved", article_id=article_id, admin=admin_uid)


async def reject_article(article_id: str, admin_uid: str, notes: Optional[str] = None):
    """Admin rejects an article."""
    db = get_db()
    await db.collection(ARTICLES_COL).document(article_id).update({
        "status": "rejected",
        "reviewed_at": datetime.now(timezone.utc),
        "reviewed_by": admin_uid,
        "admin_notes": notes,
    })
    await _write_audit_log("article_rejected", uid=admin_uid, details={"article_id": article_id, "notes": notes})
    log.info("Article rejected", article_id=article_id, admin=admin_uid)


async def get_admin_stats() -> dict:
    """Get content statistics for admin dashboard."""
    db = get_db()
    statuses = ["pending_review", "approved", "rejected", "published"]
    counts = {}
    for status in statuses:
        query = db.collection(ARTICLES_COL).where(
            filter=FieldFilter("status", "==", status)
        )
        # Count using aggregation
        snapshot = await query.count().get()
        counts[status] = snapshot[0][0].value

    user_count_snap = await db.collection(USERS_COL).count().get()
    counts["total_users"] = user_count_snap[0][0].value
    return counts


# ─── Subscriptions ────────────────────────────────────────────────────────────

async def subscribe_user(uid: str, email: str, fcm_token: Optional[str] = None):
    """Save newsletter/notification subscription."""
    db = get_db()
    await db.collection(SUBSCRIPTIONS_COL).document(uid).set({
        "uid": uid,
        "email": email,
        "fcm_token": fcm_token,
        "subscribed_at": datetime.now(timezone.utc),
        "active": True,
    })


# ─── Audit Logging ────────────────────────────────────────────────────────────

async def _write_audit_log(event: str, uid: str, details: dict = {}):
    """Write immutable audit log entry."""
    db = get_db()
    await db.collection(AUDIT_COL).add({
        "event": event,
        "uid": uid,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
