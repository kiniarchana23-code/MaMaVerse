"""
Healthcare Discovery Agent — Finds nearby healthcare facilities for mothers in India.
Uses Google Places API + Gemini grounding for accurate, location-aware results.
"""
import httpx
import structlog
from .base_agent import BaseAgent, MEDICAL_DISCLAIMER
from config import settings

log = structlog.get_logger()

SPECIALTIES_MAP = {
    "gynecologist": "gynecologist obstetrician hospital",
    "pediatrician": "pediatrician child specialist",
    "lactation_consultant": "lactation consultant breastfeeding",
    "diagnostic_center": "diagnostic center pathology lab",
    "blood_bank": "blood bank",
    "emergency": "maternity hospital emergency",
    "dental": "dentist dental clinic",
    "physiotherapy": "physiotherapy postnatal",
}


class HealthcareAgent(BaseAgent):

    async def find_facilities(
        self,
        specialty: str = "gynecologist",
        city: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: int = 10,
    ) -> dict:
        """
        Find healthcare facilities near the user.
        Supports both city-name search and lat/lng geolocation.
        """
        search_term = SPECIALTIES_MAP.get(specialty, specialty)
        results = []

        if latitude and longitude:
            # Geolocation-based search via Google Places API
            results = await self._places_nearby_search(
                latitude, longitude, search_term, radius_km * 1000
            )
        elif city:
            # City-name text search via Google Places API
            results = await self._places_text_search(city, search_term)

        if not results:
            # Fallback: Use Gemini to provide general guidance
            results = await self._gemini_fallback(specialty, city)
            return {
                "facilities": [],
                "gemini_guidance": results,
                "note": "Live search unavailable. Showing AI-generated guidance.",
                "disclaimer": MEDICAL_DISCLAIMER,
            }

        return {
            "facilities": results,
            "search_term": search_term,
            "location": city or f"{latitude},{longitude}",
            "disclaimer": (
                "Facility information sourced from Google Places. "
                "Always verify details before visiting. " + MEDICAL_DISCLAIMER
            ),
        }

    async def _places_text_search(self, city: str, search_term: str) -> list:
        """Search Google Places API by city + specialty text."""
        if not settings.GOOGLE_PLACES_API_KEY:
            return []

        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": f"{search_term} in {city}, India",
            "key": settings.GOOGLE_PLACES_API_KEY,
            "language": "en",
            "region": "in",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                data = response.json()
                return self._parse_places_results(data.get("results", []))
        except Exception as e:
            log.error("Places API text search failed", error=str(e))
            return []

    async def _places_nearby_search(
        self, lat: float, lng: float, search_term: str, radius_m: int
    ) -> list:
        """Search Google Places API by geolocation."""
        if not settings.GOOGLE_PLACES_API_KEY:
            return []

        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": radius_m,
            "keyword": search_term,
            "key": settings.GOOGLE_PLACES_API_KEY,
            "language": "en",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                data = response.json()
                return self._parse_places_results(data.get("results", []))
        except Exception as e:
            log.error("Places API nearby search failed", error=str(e))
            return []

    def _parse_places_results(self, results: list) -> list:
        """Parse Google Places API response into clean format."""
        facilities = []
        for place in results[:10]:  # Top 10 results
            maps_url = (
                f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id', '')}"
            )
            facilities.append({
                "name": place.get("name", ""),
                "address": place.get("formatted_address") or place.get("vicinity", ""),
                "rating": place.get("rating"),
                "user_ratings_total": place.get("user_ratings_total", 0),
                "open_now": place.get("opening_hours", {}).get("open_now"),
                "google_maps_url": maps_url,
                "types": place.get("types", []),
            })
        return facilities

    async def _gemini_fallback(self, specialty: str, city: str | None) -> str:
        """Fallback: Gemini-generated guidance when Places API is unavailable."""
        prompt = f"""
The user in {city or 'India'} is looking for a {specialty} for pregnancy/postnatal care.

Provide general guidance on:
1. What to look for in a {specialty} in India
2. How to find one (NMC registration check, hospital accreditation via NABH)
3. What questions to ask before choosing one
4. Government health services available (PMSMA, JSY scheme if applicable)

Keep it practical and India-specific. Do NOT make up specific clinic names or addresses.
"""
        return await self.generate(prompt, temperature=0.3)
