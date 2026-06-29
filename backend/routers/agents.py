"""
AI Agents router — handles all agent query endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from middleware.auth_middleware import get_current_user, optional_auth
from models.schemas import AgentRequest
from services.firestore_service import get_user_profile
from agents.orchestrator import MaMaVerseOrchestrator
from agents.pregnancy_agent import PregnancyAgent
from agents.newmom_agent import NewMomAgent
from agents.nutrition_agent import NutritionAgent
from agents.wellness_agent import WellnessAgent
from config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Agent singletons
orchestrator = MaMaVerseOrchestrator()
pregnancy_agent = PregnancyAgent()
newmom_agent = NewMomAgent()
nutrition_agent = NutritionAgent()
wellness_agent = WellnessAgent()

MEDICAL_DISCLAIMER = (
    "⚠️ This content is for educational purposes only. "
    "Always consult a qualified healthcare professional."
)


@router.post("/ask")
async def ask_agent(
    request: AgentRequest,
    current_user: dict | None = Depends(optional_auth),
):
    """
    Universal query endpoint. Routes to appropriate agent based on user profile.
    Available to both authenticated users and guests.
    """
    profile = {}
    if current_user:
        profile = await get_user_profile(current_user["uid"]) or {}

    # Sanitize input
    query = request.query.strip()

    # Route to appropriate agent
    user_type = profile.get("user_type", "pregnant")
    pregnancy_week = profile.get("pregnancy_week")
    baby_age_months = profile.get("baby_age_months")
    dietary_pref = profile.get("dietary_preference", "vegetarian")

    if request.agent_type == "pregnancy" or (
        request.agent_type == "general" and user_type == "pregnant"
    ):
        response_text = await pregnancy_agent.answer(query, pregnancy_week)
        agent_used = "pregnancy"

    elif request.agent_type == "newmom" or (
        request.agent_type == "general" and user_type == "new_mom"
    ):
        response_text = await newmom_agent.answer(query, baby_age_months)
        agent_used = "newmom"

    elif request.agent_type == "nutrition":
        response_text = await nutrition_agent.answer(
            query, user_type, pregnancy_week, baby_age_months, dietary_pref
        )
        agent_used = "nutrition"

    elif request.agent_type == "wellness":
        trimester = profile.get("trimester")
        response_text = await wellness_agent.answer(query, user_type, {"trimester": trimester})
        agent_used = "wellness"

    else:
        # Orchestrate routing for "general"
        routing = await orchestrator.orchestrate(query, profile)
        agent_used = routing.get("agent_type", "general")
        response_text = await _route_to_agent(
            agent_used, query, user_type, pregnancy_week, baby_age_months, dietary_pref
        )

    return {
        "response": response_text,
        "agent_used": agent_used,
        "disclaimer": MEDICAL_DISCLAIMER,
        "sources": ["WHO", "NHS", "ICMR", "FOGSI", "AAP"],
    }


@router.get("/pregnancy/week/{week}")
async def get_pregnancy_week_summary(
    week: int,
    current_user: dict | None = Depends(optional_auth),
):
    """Get complete week-by-week pregnancy summary."""
    if week < 1 or week > 42:
        raise HTTPException(status_code=400, detail="Week must be between 1 and 42")
    result = await pregnancy_agent.get_week_summary(week)
    return result


@router.get("/newmom/month/{month}")
async def get_baby_month_guide(
    month: int,
    current_user: dict | None = Depends(optional_auth),
):
    """Get complete monthly guide for baby development."""
    if month < 0 or month > 36:
        raise HTTPException(status_code=400, detail="Month must be between 0 and 36")
    result = await newmom_agent.get_monthly_guide(month)
    return result


@router.get("/nutrition/meal-plan")
async def get_meal_plan(
    current_user: dict = Depends(get_current_user),
):
    """Get a personalized 7-day Indian meal plan."""
    profile = await get_user_profile(current_user["uid"]) or {}
    result = await nutrition_agent.get_weekly_meal_plan(
        pregnancy_week=profile.get("pregnancy_week"),
        baby_age_months=profile.get("baby_age_months"),
        dietary_pref=profile.get("dietary_preference", "vegetarian"),
    )
    return result


@router.get("/wellness/mindfulness")
async def get_mindfulness_exercise(
    current_user: dict | None = Depends(optional_auth),
):
    """Get a guided mindfulness/breathing exercise."""
    profile = {}
    if current_user:
        profile = await get_user_profile(current_user["uid"]) or {}
    user_type = profile.get("user_type", "pregnant")
    trimester = profile.get("trimester")
    result = await wellness_agent.get_mindfulness_exercise(user_type, trimester)
    return {"exercise": result, "disclaimer": MEDICAL_DISCLAIMER}


async def _route_to_agent(
    agent_type: str, query: str, user_type: str,
    pregnancy_week, baby_age_months, dietary_pref
) -> str:
    if agent_type == "nutrition":
        return await nutrition_agent.answer(query, user_type, pregnancy_week, baby_age_months, dietary_pref)
    elif agent_type == "wellness":
        return await wellness_agent.answer(query, user_type)
    elif agent_type == "newmom":
        return await newmom_agent.answer(query, baby_age_months)
    else:
        return await pregnancy_agent.answer(query, pregnancy_week)
