"""Healthcare router — find nearby healthcare facilities."""
from fastapi import APIRouter, Depends
from middleware.auth_middleware import optional_auth
from models.schemas import HealthcareSearchRequest
from agents.healthcare_agent import HealthcareAgent

router = APIRouter()
healthcare_agent = HealthcareAgent()


@router.post("/search")
async def search_healthcare(
    request: HealthcareSearchRequest,
    current_user: dict | None = Depends(optional_auth),
):
    """Find nearby healthcare facilities by city or geolocation."""
    result = await healthcare_agent.find_facilities(
        specialty=request.specialty or "gynecologist",
        city=request.city,
        latitude=request.latitude,
        longitude=request.longitude,
        radius_km=request.radius_km,
    )
    return result


@router.get("/specialties")
async def list_specialties():
    """List available healthcare specialties to search."""
    return {
        "specialties": [
            {"id": "gynecologist", "label": "Gynecologist / Obstetrician"},
            {"id": "pediatrician", "label": "Pediatrician"},
            {"id": "lactation_consultant", "label": "Lactation Consultant"},
            {"id": "diagnostic_center", "label": "Diagnostic Center / Lab"},
            {"id": "blood_bank", "label": "Blood Bank"},
            {"id": "emergency", "label": "Maternity Hospital Emergency"},
            {"id": "dental", "label": "Dentist"},
            {"id": "physiotherapy", "label": "Physiotherapy"},
        ]
    }
