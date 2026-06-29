"""
AI Agent Orchestrator for MaMaVerse.
Routes user queries to the appropriate specialist agent based on user profile.
Uses Google Gemini API with strict grounding and anti-hallucination prompts.
"""
import structlog
import google.generativeai as genai
from config import settings
from .base_agent import BaseAgent, MEDICAL_DISCLAIMER

log = structlog.get_logger()

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


class MaMaVerseOrchestrator(BaseAgent):
    """
    Central orchestrator that understands user context and delegates
    to the right specialist agent.
    """

    SYSTEM_PROMPT = """You are MaMaVerse's AI Orchestrator — a responsible medical information router.

Your role:
1. Understand the user's context (pregnant/new mom, week/age)
2. Route queries to the right specialist
3. NEVER make up medical information
4. ALWAYS cite that information comes from verified medical sources (WHO, NHS, ICMR)
5. ALWAYS include the medical disclaimer

STRICT RULES:
- Never diagnose conditions
- Never prescribe medications or dosages
- Never contradict established medical guidelines
- If unsure, say "Please consult your healthcare provider"
- Only use knowledge from our approved knowledge base
"""

    async def orchestrate(self, query: str, user_profile: dict) -> dict:
        """Route query to appropriate agent based on user profile and query type."""
        user_type = user_profile.get("user_type", "pregnant")
        pregnancy_week = user_profile.get("pregnancy_week")
        baby_age_months = user_profile.get("baby_age_months")
        city = user_profile.get("city", "")

        context_str = self._build_context(user_type, pregnancy_week, baby_age_months, city)

        routing_prompt = f"""
{self.SYSTEM_PROMPT}

User Context: {context_str}
User Query: "{query}"

Determine which specialist agent should handle this:
- "pregnancy" — fetal development, pregnancy symptoms, prenatal care, birth prep
- "newmom" — newborn care, breastfeeding, baby sleep, postpartum recovery
- "nutrition" — food, diet, Indian meals, nutrients, vitamins
- "wellness" — mental health, emotions, stress, mindfulness, self-care
- "healthcare" — finding hospitals, doctors, diagnostic centers
- "general" — general pregnancy/parenting information

Respond with ONLY the agent name (one word).
"""
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = await model.generate_content_async(routing_prompt)
        agent_type = response.text.strip().lower()

        if agent_type not in ["pregnancy", "newmom", "nutrition", "wellness", "healthcare", "general"]:
            agent_type = "general"

        log.info("Query routed", agent_type=agent_type, user_type=user_type)
        return {"agent_type": agent_type, "context": context_str}

    def _build_context(
        self, user_type: str, pregnancy_week: int | None,
        baby_age_months: int | None, city: str
    ) -> str:
        if user_type == "pregnant" and pregnancy_week:
            trimester = (
                "first trimester (weeks 1–12)" if pregnancy_week <= 12
                else "second trimester (weeks 13–26)" if pregnancy_week <= 26
                else "third trimester (weeks 27–40)"
            )
            return f"Pregnant woman at week {pregnancy_week} ({trimester}), city: {city or 'India'}"
        elif user_type == "new_mom" and baby_age_months is not None:
            return f"New mother with baby aged {baby_age_months} months, city: {city or 'India'}"
        return f"User type: {user_type}, city: {city or 'India'}"
