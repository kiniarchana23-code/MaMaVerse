"""
Base Agent class with shared Gemini integration, anti-hallucination guardrails,
and medical disclaimer injection.
"""
import google.generativeai as genai
import structlog
from config import settings

log = structlog.get_logger()

# Configure Gemini with API key
genai.configure(api_key=settings.GEMINI_API_KEY)

MEDICAL_DISCLAIMER = (
    "\n\n---\n⚠️ **Medical Disclaimer**: This information is for educational purposes only "
    "and does not constitute medical advice. Always consult your gynecologist, "
    "pediatrician, or qualified healthcare professional before making any health decisions."
)

ANTI_HALLUCINATION_RULES = """
CRITICAL RULES — You MUST follow these without exception:
1. ONLY provide information that aligns with WHO, NHS, ICMR, FOGSI, AAP, or NHP India guidelines
2. NEVER invent statistics, drug names, or medical procedures
3. If you don't have verified information, say: "For this specific question, please consult your doctor"
4. NEVER give specific medication dosages
5. NEVER diagnose medical conditions
6. ALWAYS recommend consulting a healthcare professional for personal medical decisions
7. For Indian context: use Indian medical terminology, Indian food names, ICMR guidelines
8. Always be warm, supportive, and empathetic — mothers need reassurance
"""

SAFETY_CONFIG = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


class BaseAgent:
    """Base class for all MaMaVerse AI agents."""

    MODEL = settings.GEMINI_MODEL
    SYSTEM_PROMPT = ""

    def _get_model(self) -> genai.GenerativeModel:
        return genai.GenerativeModel(
            model_name=self.MODEL,
            system_instruction=self.SYSTEM_PROMPT,
            safety_settings=SAFETY_CONFIG,
        )

    async def generate(self, prompt: str, temperature: float = 0.3) -> str:
        """Generate a response with low temperature for factual accuracy."""
        model = self._get_model()
        config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=1024,
            top_p=0.9,
        )
        try:
            response = await model.generate_content_async(
                prompt, generation_config=config
            )
            text = response.text or ""
            # Inject disclaimer if not already present
            if "educational purposes" not in text.lower():
                text += MEDICAL_DISCLAIMER
            return text
        except Exception as e:
            log.error("Agent generation error", agent=self.__class__.__name__, error=str(e))
            return (
                "I'm unable to provide information on this right now. "
                "Please consult your healthcare provider for guidance." + MEDICAL_DISCLAIMER
            )

    def _sanitize_input(self, text: str) -> str:
        """Basic prompt injection prevention."""
        dangerous_patterns = [
            "ignore previous", "forget instructions", "system:", "assistant:",
            "jailbreak", "pretend you are", "act as", "roleplay",
        ]
        sanitized = text
        for pattern in dangerous_patterns:
            if pattern.lower() in sanitized.lower():
                sanitized = "[Query filtered for safety]"
                log.warning("Prompt injection attempt detected", pattern=pattern)
                break
        return sanitized[:500]  # Max 500 chars
