"""Content router — fetch published knowledge articles."""
from fastapi import APIRouter, Depends
from middleware.auth_middleware import optional_auth
from services.firestore_service import get_published_articles

router = APIRouter()


@router.get("/articles")
async def get_articles(
    category: str | None = None,
    pregnancy_week: int | None = None,
    baby_age_months: int | None = None,
    limit: int = 20,
    current_user: dict | None = Depends(optional_auth),
):
    """Get published knowledge articles, filtered by category/week/age."""
    articles = await get_published_articles(
        category=category,
        pregnancy_week=pregnancy_week,
        baby_age_months=baby_age_months,
        limit=limit,
    )
    # Filter by week/age in-memory (Firestore array-contains limitation)
    if pregnancy_week is not None:
        articles = [
            a for a in articles
            if a.get("pregnancy_weeks") is None
            or pregnancy_week in (a.get("pregnancy_weeks") or [])
        ]
    if baby_age_months is not None:
        articles = [
            a for a in articles
            if a.get("baby_age_months") is None
            or baby_age_months in (a.get("baby_age_months") or [])
        ]
    return {
        "articles": articles,
        "count": len(articles),
        "disclaimer": (
            "All articles are for educational purposes only. "
            "Consult your healthcare provider for medical advice."
        ),
    }



