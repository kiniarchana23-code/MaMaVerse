"""
Pregnancy Knowledge Agent — Provides week-by-week pregnancy information.
Sources: WHO Antenatal Care Guidelines, FOGSI, ICMR, NHS Pregnancy Guide.
"""
from .base_agent import BaseAgent, ANTI_HALLUCINATION_RULES, MEDICAL_DISCLAIMER


class PregnancyAgent(BaseAgent):
    SYSTEM_PROMPT = f"""You are MaMaVerse's Pregnancy Knowledge Agent — a warm, knowledgeable 
pregnancy companion grounded in WHO, FOGSI, ICMR, and NHS guidelines.

{ANTI_HALLUCINATION_RULES}

Your expertise covers:
- Week-by-week fetal development (size, organ formation, movements)
- Prenatal medical tests in India (double marker, quadruple marker, anomaly scan, TIFFA scan, GCT, GTT, OGTT)
- Common symptoms by trimester and how to manage them safely
- Warning signs that need immediate medical attention
- Birth preparation (birth plan, hospital bag, labor signs)
- Antenatal yoga and safe exercises (consult doctor first)
- Vaccination schedule during pregnancy (Td, TT as per Indian guidelines)

Indian context: Use Indian medical terms, reference AIIMS and leading Indian hospitals where relevant.
Always be warm, reassuring, and supportive — pregnancy can be overwhelming.
"""

    async def answer(self, query: str, pregnancy_week: int | None, context: dict = {}) -> str:
        sanitized = self._sanitize_input(query)
        week_context = f"The user is at pregnancy week {pregnancy_week}." if pregnancy_week else ""
        trimester = ""
        if pregnancy_week:
            if pregnancy_week <= 12:
                trimester = "First Trimester (Weeks 1–12)"
            elif pregnancy_week <= 26:
                trimester = "Second Trimester (Weeks 13–26)"
            else:
                trimester = "Third Trimester (Weeks 27–40)"

        prompt = f"""
{week_context} {f'Currently in: {trimester}.' if trimester else ''}

User's question: "{sanitized}"

Provide a warm, factual, and structured answer. Use Indian context where relevant.
Format with clear headings if the response is detailed.
Include what the baby looks like / is doing this week if the question is about fetal development.
List any relevant medical tests for this week if applicable (Indian standards: double marker, TIFFA scan, etc.)
"""
        return await self.generate(prompt, temperature=0.25)

    async def get_week_summary(self, week: int) -> dict:
        """Get complete summary for a specific pregnancy week."""
        prompt = f"""
Provide a comprehensive Week {week} Pregnancy Summary for an Indian mother.

Structure your response with these sections:
## 🌱 Baby's Development (Week {week})
[Describe size in Indian fruit/vegetable equivalents, key developments]

## 🤱 How Mom is Feeling
[Common symptoms this week, what's normal]

## 🏥 Medical Tests This Week
[List tests recommended in India for this week, from ICMR/FOGSI guidelines]

## 🥗 Nutrition Focus
[Key nutrients needed, 2-3 Indian food recommendations]

## ⚠️ When to Call Your Doctor
[Red flag symptoms that need immediate attention]

## 💡 Tip of the Week
[One practical, supportive tip]

Keep it warm, informative, and evidence-based. Indian context throughout.
"""
        content = await self.generate(prompt, temperature=0.2)
        return {
            "week": week,
            "content": content,
            "disclaimer": MEDICAL_DISCLAIMER,
            "sources": ["WHO Antenatal Care Guidelines", "FOGSI Guidelines", "ICMR"],
        }
