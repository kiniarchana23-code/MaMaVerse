"""
New Mom Agent — Comprehensive postnatal and baby care guidance.
Sources: AAP (American Academy of Pediatrics), WHO, NHS, IAP (Indian Academy of Pediatrics).
"""
from .base_agent import BaseAgent, ANTI_HALLUCINATION_RULES, MEDICAL_DISCLAIMER


class NewMomAgent(BaseAgent):
    SYSTEM_PROMPT = f"""You are MaMaVerse's New Mom Agent — a compassionate, knowledgeable 
postnatal companion grounded in AAP, WHO, NHS, and IAP (Indian Academy of Pediatrics) guidelines.

{ANTI_HALLUCINATION_RULES}

Your expertise covers:
- Newborn care (bathing, umbilical cord care, skin care)
- Breastfeeding (latch, positions, milk supply, engorgement, mastitis signs)
- Formula feeding guidance when needed
- Baby sleep safety (safe sleep practices, SIDS prevention — as per AAP)
- Postpartum recovery (physical: C-section care, vaginal birth recovery)
- Postpartum emotional health (baby blues vs postpartum depression)
- Baby growth milestones by month (IAP growth charts)
- Vaccination schedule (IAP immunization schedule for India)
- Baby-proofing and safety
- When to call the pediatrician (red flags)
- Useful baby care products and gadgets (evidence-based recommendations)

Always be warm, non-judgmental, and supportive. Motherhood is hard — acknowledge that.
Indian context: Use Indian terms, reference IAP guidelines, Indian hospital practices.
"""

    async def answer(self, query: str, baby_age_months: int | None, context: dict = {}) -> str:
        sanitized = self._sanitize_input(query)
        age_context = f"The baby is {baby_age_months} months old." if baby_age_months is not None else ""

        prompt = f"""
{age_context}

New mom's question: "{sanitized}"

Provide a warm, practical, evidence-based answer.
Use Indian context where relevant (Indian formula brands, IAP vaccination schedule, etc.)
If this is about baby milestones, be careful to note that development varies normally between babies.
Format with clear sections if detailed.
"""
        return await self.generate(prompt, temperature=0.25)

    async def get_monthly_guide(self, baby_age_months: int) -> dict:
        """Get complete guide for a specific baby age in months."""
        age_label = f"{baby_age_months} month{'s' if baby_age_months != 1 else ''}"
        prompt = f"""
Create a comprehensive Baby Guide for Month {baby_age_months} for an Indian new mom.

## 👶 What to Expect at {age_label}
[Key developmental changes this month]

## 🎯 Developmental Milestones (Month {baby_age_months})
[Motor, cognitive, social, language milestones — IAP guidelines. 
 Note: wide normal range, avoid alarming language]

## 🤱 Feeding at {age_label}
[Breastfeeding, formula, or solid food introduction as appropriate by age]

## 😴 Sleep Pattern
[Typical sleep at this age, safe sleep practices]

## 💉 Vaccinations This Month
[IAP Immunization Schedule for India — which vaccines are due]

## 🎮 Stimulation & Play Ideas
[Age-appropriate activities, toys, interactions]

## ❤️ Mom's Self-Care
[Postpartum recovery, emotional health, returning to work tips if applicable]

## 🚨 Call Your Pediatrician If...
[Age-appropriate red flags]

Keep it warm, encouraging, and practical. Indian context throughout.
"""
        content = await self.generate(prompt, temperature=0.2)
        return {
            "baby_age_months": baby_age_months,
            "content": content,
            "disclaimer": MEDICAL_DISCLAIMER,
            "sources": ["AAP", "IAP Immunization Schedule", "WHO Child Growth Standards"],
        }
