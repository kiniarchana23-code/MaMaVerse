"""
Wellness Agent — Mental and emotional health support for pregnant women and new mothers.
Sources: WHO Mental Health Guidelines, NIMHANS, Postpartum Support International.
"""
from .base_agent import BaseAgent, ANTI_HALLUCINATION_RULES, MEDICAL_DISCLAIMER


class WellnessAgent(BaseAgent):
    SYSTEM_PROMPT = f"""You are MaMaVerse's Wellness Agent — a warm, empathetic mental and 
emotional health companion for pregnant women and new mothers.

{ANTI_HALLUCINATION_RULES}

Your expertise (grounded in WHO, NIMHANS, Postpartum Support International):
- Perinatal mental health (anxiety, depression — educational, NOT diagnostic)
- Baby blues vs. postpartum depression: differences and when to seek help
- Stress management techniques safe during pregnancy
- Mindfulness and meditation practices (pranayama, breathing exercises)
- Sleep hygiene for pregnant women and new mothers
- Relationship changes: partner, family dynamics during transition to parenthood
- Body image and self-esteem during and after pregnancy
- Returning to work after maternity leave
- Social support and community connection
- Indian cultural context: joint family dynamics, in-law relationships, societal pressures
- Emergency resources: iCall India (9152987821), Vandrevala Foundation (1860-2662-345)

IMPORTANT: You are NOT a therapist. If someone describes serious distress, suicidal thoughts, 
or inability to function, always refer them to professional help and provide crisis helpline numbers.

Be warm, non-judgmental, validating. Acknowledge the emotional complexity of motherhood.
"""

    CRISIS_KEYWORDS = [
        "suicidal", "suicide", "want to die", "hurt myself",
        "can't go on", "no reason to live", "harm my baby"
    ]

    async def answer(self, query: str, user_type: str, context: dict = {}) -> str:
        sanitized = self._sanitize_input(query)

        # Check for crisis signals
        if any(kw in sanitized.lower() for kw in self.CRISIS_KEYWORDS):
            return self._crisis_response()

        prompt = f"""
User type: {user_type}

Wellness question: "{sanitized}"

Provide a warm, empathetic, evidence-based response.
- Validate their feelings first ("It's completely normal to feel...")
- Offer 2-3 practical coping strategies
- Use breathing/mindfulness exercises where appropriate
- Reference Indian context (pranayama, yoga, family support systems)
- If symptoms sound like more than everyday stress, gently suggest consulting a mental health professional
- Include NIMHANS or iCall helpline if relevant
"""
        return await self.generate(prompt, temperature=0.35)

    async def get_mindfulness_exercise(self, user_type: str, trimester: str | None = None) -> str:
        """Get a guided mindfulness exercise."""
        context = f"Trimester: {trimester}" if trimester else f"User type: {user_type}"
        prompt = f"""
Create a gentle 5-minute guided mindfulness/breathing exercise for:
{context}

Make it:
- Safe for pregnancy (no breath retention, no lying flat on back if 3rd trimester)
- Simple enough to do at home
- Include: grounding technique + deep breathing + positive affirmation
- Use warm, soothing language
- End with an encouraging affirmation specific to their stage of motherhood
"""
        return await self.generate(prompt, temperature=0.4)

    def _crisis_response(self) -> str:
        return (
            "💙 I hear you, and I'm glad you reached out. What you're feeling is real and valid.\n\n"
            "**Please contact a mental health professional right away:**\n\n"
            "🇮🇳 **India Crisis Helplines:**\n"
            "- **iCall** (Tata Institute of Social Sciences): **9152987821** — Mon–Sat, 8am–10pm\n"
            "- **Vandrevala Foundation**: **1860-2662-345** — 24/7\n"
            "- **NIMHANS**: **080-46110007**\n"
            "- **SNEHI**: **044-24640050**\n\n"
            "Please talk to your doctor, a trusted family member, or a mental health professional. "
            "You deserve support, and help is available.\n\n"
            + MEDICAL_DISCLAIMER
        )
