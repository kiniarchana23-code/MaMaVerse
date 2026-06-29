"""Admin router — content ingestion, review, approve/reject."""
from fastapi import APIRouter, Depends, HTTPException, status
from middleware.auth_middleware import require_admin
from models.schemas import ArticleReviewAction, ContentIngestionRequest, AdminStats
from services.firestore_service import (
    get_pending_articles, approve_article, reject_article,
    get_published_articles, get_admin_stats, create_article,
)
from agents.admin_review_agent import AdminReviewAgent

router = APIRouter()
review_agent = AdminReviewAgent()


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_content(
    request: ContentIngestionRequest,
    admin: dict = Depends(require_admin),
):
    """
    Admin submits a URL from an approved medical source.
    AI agent fetches, summarizes, scores, and queues for review.
    """
    result = await review_agent.process_url(
        url=str(request.source_url),
        category=request.category,
        notes=request.notes or "",
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    article_id = await create_article(result)
    return {
        "message": "Content processed and queued for review",
        "article_id": article_id,
        "title": result.get("title"),
        "confidence_score": result.get("ai_confidence_score"),
        "risk_flags": result.get("risk_flags", []),
    }


@router.get("/pending")
async def get_pending_content(admin: dict = Depends(require_admin)):
    """Get all articles pending admin review."""
    articles = await get_pending_articles(limit=50)
    return {"articles": articles, "count": len(articles)}


@router.post("/articles/{article_id}/review")
async def review_article(
    article_id: str,
    action: ArticleReviewAction,
    admin: dict = Depends(require_admin),
):
    """Admin approves or rejects an article."""
    if action.action == "approve":
        await approve_article(article_id, admin["uid"], action.admin_notes)
        return {"message": "Article approved and published", "article_id": article_id}
    elif action.action == "reject":
        await reject_article(article_id, admin["uid"], action.admin_notes)
        return {"message": "Article rejected", "article_id": article_id}
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")


@router.get("/stats")
async def get_stats(admin: dict = Depends(require_admin)):
    """Get platform statistics for admin dashboard."""
    stats = await get_admin_stats()
    return stats


@router.get("/published")
async def get_all_published(
    category: str | None = None,
    admin: dict = Depends(require_admin)
):
    """Get all published articles (admin view)."""
    articles = await get_published_articles(category=category, limit=100)
    return {"articles": articles, "count": len(articles)}
