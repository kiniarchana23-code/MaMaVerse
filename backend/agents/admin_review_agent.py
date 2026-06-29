"""
Admin Review Agent — Crawls verified medical sources, summarizes content,
scores confidence, detects duplicates, and prepares articles for admin review.

Sources: WHO, NHS, ICMR, NHP India, FOGSI, AAP, PubMed abstracts.
"""
import httpx
import structlog
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential
from .base_agent import BaseAgent, ANTI_HALLUCINATION_RULES
from config import settings

log = structlog.get_logger()

# Verified, trusted medical sources only
APPROVED_SOURCES = {
    "WHO": "https://www.who.int",
    "NHS": "https://www.nhs.uk",
    "NHP India": "https://www.nhp.gov.in",
    "ICMR": "https://www.icmr.gov.in",
    "PubMed": "https://pubmed.ncbi.nlm.nih.gov",
    "CDC": "https://www.cdc.gov",
    "AAP": "https://www.aap.org",
    "FOGSI": "https://www.fogsi.org",
    "La Leche League": "https://www.llli.org",
}


class AdminReviewAgent(BaseAgent):
    SYSTEM_PROMPT = f"""You are MaMaVerse's Admin Review Agent — a responsible medical content 
processor that summarizes and validates health information from trusted sources.

{ANTI_HALLUCINATION_RULES}

Your tasks:
1. Summarize medical content from trusted sources (WHO, NHS, ICMR, etc.)
2. Assess confidence score (0.0–1.0) based on source quality and clarity
3. Categorize content (pregnancy, newborn, nutrition, wellness, etc.)
4. Detect if content is a duplicate of existing knowledge
5. Flag any potentially harmful or misleading claims
6. Extract pregnancy-week relevance (if applicable)
7. Format content for admin review with clear source attribution

NEVER invent, modify, or extrapolate information. Only summarize what the source says.
"""

    async def process_url(self, url: str, category: str, notes: str = "") -> dict:
        """
        Full pipeline: fetch → extract text → summarize → score → prepare for admin.
        """
        # Step 1: Validate source URL is from approved domain
        source_name, is_approved = self._validate_source(url)
        if not is_approved:
            return {
                "error": (
                    f"Source URL not in approved list. Only content from trusted medical "
                    f"organizations is accepted: {', '.join(APPROVED_SOURCES.keys())}"
                ),
                "approved_sources": list(APPROVED_SOURCES.keys()),
            }

        # Step 2: Fetch and extract article content
        raw_text = await self._fetch_article(url)
        if not raw_text:
            return {"error": "Could not fetch content from URL. Please check and retry."}

        # Step 3: AI summarization
        summary_result = await self._summarize_content(raw_text, source_name, category, url)

        # Step 4: Prepare for Firestore (pending admin review)
        article_data = {
            "title": summary_result.get("title", "Untitled"),
            "summary": summary_result.get("summary", ""),
            "full_content": summary_result.get("full_content", raw_text[:5000]),
            "source_url": url,
            "source_name": source_name,
            "category": category,
            "tags": summary_result.get("tags", []),
            "pregnancy_weeks": summary_result.get("pregnancy_weeks"),
            "baby_age_months": summary_result.get("baby_age_months"),
            "ai_confidence_score": summary_result.get("confidence_score", 0.7),
            "risk_flags": summary_result.get("risk_flags", []),
            "admin_notes": notes,
            "status": "pending_review",
        }

        log.info(
            "Article processed for admin review",
            source=source_name,
            title=article_data["title"],
            confidence=article_data["ai_confidence_score"],
        )
        return article_data

    def _validate_source(self, url: str) -> tuple[str, bool]:
        """Check if URL belongs to an approved medical source."""
        for name, domain in APPROVED_SOURCES.items():
            if domain.replace("https://", "").replace("http://", "") in url:
                return name, True
        return "Unknown", False

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _fetch_article(self, url: str) -> str | None:
        """Fetch article content with retry logic."""
        headers = {
            "User-Agent": (
                "MaMaVerseBot/1.0 (Medical Knowledge Aggregator; "
                "contact: admin@mamaverse.app)"
            )
        }
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    log.warning("Non-200 response", url=url, status=response.status_code)
                    return None

                soup = BeautifulSoup(response.text, "lxml")
                # Remove navigation, ads, scripts, styles
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()

                # Get main content
                main = (
                    soup.find("main")
                    or soup.find("article")
                    or soup.find(id="content")
                    or soup.find(class_="content")
                    or soup.body
                )
                text = main.get_text(separator="\n", strip=True) if main else ""
                return text[:8000]  # Limit to avoid token overflow

        except Exception as e:
            log.error("Article fetch failed", url=url, error=str(e))
            return None

    async def _summarize_content(
        self, raw_text: str, source_name: str, category: str, url: str
    ) -> dict:
        """Use Gemini to summarize and score the article."""
        prompt = f"""
You are processing medical content from {source_name} for a maternal health app.

Source URL: {url}
Category: {category}

Raw content:
---
{raw_text[:4000]}
---

Please analyze and respond in this EXACT JSON format:
{{
  "title": "Clear, descriptive title of the article",
  "summary": "2-3 sentence plain-language summary for mothers",
  "full_content": "Comprehensive but readable version (500-800 words max). Keep medical accuracy.",
  "tags": ["tag1", "tag2", "tag3"],
  "pregnancy_weeks": [list of relevant weeks 1-40, or null if not week-specific],
  "baby_age_months": [list of relevant months 0-24, or null if not age-specific],
  "confidence_score": 0.85,  // 0.0-1.0 based on source quality, clarity, evidence quality
  "risk_flags": []  // List any concerning claims or anything that needs careful admin review
}}

RULES for confidence scoring:
- WHO/NHS/ICMR primary source = 0.85-0.95
- Secondary summary = 0.65-0.80
- Contradicts established guidelines = 0.3-0.5 (flag it)
- Potentially harmful advice = flag as risk and score 0.1-0.3
"""
        try:
            import json
            raw_response = await self.generate(prompt, temperature=0.1)
            # Extract JSON from response
            start = raw_response.find("{")
            end = raw_response.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(raw_response[start:end])
        except Exception as e:
            log.error("Summarization JSON parse failed", error=str(e))

        # Fallback structure
        return {
            "title": "Article from " + source_name,
            "summary": raw_text[:300],
            "full_content": raw_text[:2000],
            "tags": [category],
            "pregnancy_weeks": None,
            "baby_age_months": None,
            "confidence_score": 0.6,
            "risk_flags": ["Manual review required — auto-parsing failed"],
        }
