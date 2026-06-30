"""
Nutrition Agent — Indian diet-focused nutrition guidance for pregnancy and postpartum.
Sources: ICMR Dietary Guidelines, NIN (National Institute of Nutrition) India, WHO.
"""
from .base_agent import BaseAgent, ANTI_HALLUCINATION_RULES, MEDICAL_DISCLAIMER


class NutritionAgent(BaseAgent):
    SYSTEM_PROMPT = f"""You are MaMaVerse's Nutrition Agent — a warm, knowledgeable nutrition 
guide specializing in pregnancy and postpartum nutrition for Indian mothers.

{ANTI_HALLUCINATION_RULES}

Your expertise (grounded in ICMR-NIN guidelines and WHO recommendations):
- Trimester-specific calorie and nutrient requirements (Indian RDA values)
- Iron-rich Indian foods (dates, spinach/palak, sesame/til, horse gram/kulthi, amla)
- Calcium sources (ragi, sesame, dairy, leafy greens)
- Folic acid sources (methi, spinach, lentils/dal)
- Protein sources (dal, rajma, chana, paneer, eggs, fish — veg and non-veg options)
- Vitamin D (sunlight, fortified milk)
- Omega-3 (flaxseeds/alsi, walnuts, fish like rohu, pomfret)
- Foods to avoid during pregnancy (raw papaya, unpasteurized dairy, excess vitamin A liver)
- Gestational diabetes diet (low GI Indian foods)
- Postpartum foods (traditional Indian postnatal diet: gondh laddoo, ajwain, methi laddoo)
- Breastfeeding nutrition
- Water intake recommendations
- Regional Indian cuisine variations (North, South, West, East Indian foods)

Always give practical meal suggestions using common Indian ingredients.
Respect vegetarian and non-vegetarian preferences.
"""

    async def answer(
        self, query: str, user_type: str, pregnancy_week: int | None,
        baby_age_months: int | None, dietary_pref: str = "vegetarian"
    ) -> str:
        sanitized = self._sanitize_input(query)

        # Build context inline
        if user_type == "pregnant" and pregnancy_week:
            trimester = (
                "first trimester (weeks 1–12)" if pregnancy_week <= 12
                else "second trimester (weeks 13–26)" if pregnancy_week <= 26
                else "third trimester (weeks 27–40)"
            )
            context = f"Pregnant woman at week {pregnancy_week} ({trimester}), dietary preference: {dietary_pref}"
        elif user_type == "new_mom" and baby_age_months is not None:
            context = f"New mother with baby aged {baby_age_months} months, dietary preference: {dietary_pref}"
        else:
            context = f"User type: {user_type}, dietary preference: {dietary_pref}"

        prompt = f"""
Context: {context}
Dietary preference: {dietary_pref}

Nutrition question: "{sanitized}"

Provide practical, Indian-context nutrition advice.
- Use Indian food names (with English in brackets if needed)
- Give specific meal examples using common ingredients
- Include quantities where helpful (e.g., "2 tablespoons of til/sesame seeds provides X mg calcium")
- ICMR-NIN daily requirements for relevant nutrients
"""
        return await self.generate(prompt, temperature=0.2)

    async def get_weekly_meal_plan(
        self,
        pregnancy_week: int | None,
        baby_age_months: int | None,
        dietary_pref: str = "vegetarian"
    ) -> dict:
        """Get a 7-day Indian meal plan."""
        if pregnancy_week:
            context = f"Pregnancy Week {pregnancy_week}"
            trimester = "First" if pregnancy_week <= 12 else "Second" if pregnancy_week <= 26 else "Third"
            nutrient_focus = {
                "First": "folic acid, iron, vitamin B6 (for nausea)",
                "Second": "calcium, iron, protein, omega-3",
                "Third": "iron, calcium, vitamin K, hydration",
            }[trimester]
        else:
            context = f"Postpartum (baby {baby_age_months} months)"
            nutrient_focus = "iron (replenishment), calcium, protein, lactation support"

        prompt = f"""
Create a 7-day Indian meal plan for: {context}
Dietary preference: {dietary_pref}
Nutrient focus: {nutrient_focus}

Format as a table with columns: Day | Breakfast | Lunch | Dinner | Snacks
Use common Indian dishes. Keep it realistic and practical.
Include a brief note on key nutrients each day provides.
Separate vegetarian options clearly.
Add one traditional Indian remedy/food tip (e.g., haldi milk, ajwain water).

{ICMR_NOTE}
"""
        content = await self.generate(prompt, temperature=0.2)
        return {
            "meal_plan": content,
            "dietary_preference": dietary_pref,
            "disclaimer": MEDICAL_DISCLAIMER,
            "sources": ["ICMR-NIN Dietary Guidelines 2020", "WHO Nutrition in Pregnancy"],
        }


ICMR_NOTE = """
Base recommendations on ICMR-NIN Dietary Guidelines for Indians (2020).
Include approximate nutritional values where relevant.
"""
