import hashlib
import json
import logging
import os

from django.core.cache import cache
from google import genai
from google.genai import types as genai_types

from app0.models import BuildSession

logger = logging.getLogger(__name__)

MODEL_ID = os.environ.get('GEMINI_MODEL_ID', 'gemini-2.0-flash')

# Redis cache TTL for assessments (10 minutes)
ASSESSMENT_TTL = 60 * 10

PURPOSE_LABELS = {
    "gaming": "Gaming",
    "workstation": "Workstation / Professional 3D",
    "video_editing": "Video Editing / Content Creation",
}

ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "overall_color": {
            "type": "string",
            "enum": ["green", "yellow", "red"],
        },
        "headline": {"type": "string"},
        "analysis": {"type": "string"},
        "actionable_advice": {"type": "string"},
        "flagged_components": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": ["overall_color", "headline", "analysis", "actionable_advice", "flagged_components"],
}

FALLBACK_ASSESSMENT = {
    "overall_color": "green",
    "headline": "",
    "analysis": "",
    "actionable_advice": "",
    "flagged_components": [],
}

ASSESSMENT_SYSTEM_PROMPT = """You are a PC hardware expert evaluating a custom PC build for a user.
Your job is to assess whether the selected components are well-matched for the user's stated purpose.

Rules:
- Evaluate hardware synergy, bottlenecks, and purpose-alignment ONLY.
- Do NOT evaluate physical compatibility (that is handled separately by the store's engine).
- Do NOT access the internet. Reason from your own training knowledge of PC hardware.
- Do NOT evaluate budget or price — the user already chose these parts.
- Be concise. The headline should be under 10 words. The analysis under 50 words.

Color semantics:
- green: Build is well-balanced for the stated purpose. No meaningful issues.
- yellow: Minor bottleneck or suboptimal pairing, but the build will work. An upgrade is recommended but not critical.
- red: A significant mismatch exists that will visibly hurt performance for the stated purpose (e.g., severe PSU undersizing, major CPU/GPU tier imbalance, RAM bottleneck for the workload).

You MUST return ONLY a valid JSON object matching the given schema. No extra text."""


def _build_prompt(session: BuildSession) -> str:
    purpose_label = PURPOSE_LABELS.get(session.purpose or "gaming", "Gaming")
    parts = []

    if session.cpu:
        tdp = getattr(session.cpu, 'wattage', 'unknown')
        parts.append(f"CPU: {session.cpu.name} (~{tdp}W TDP)")
    if session.gpu:
        tdp = getattr(session.gpu, 'wattage', 'unknown')
        parts.append(f"GPU: {session.gpu.name} (~{tdp}W TDP)")
    if session.motherboard:
        parts.append(f"Motherboard: {session.motherboard.name} ({getattr(session.motherboard, 'form_factor', '')})")
    if session.ram:
        parts.append(f"RAM: {session.ram.name}")
    if session.psu:
        parts.append(f"PSU: {session.psu.wattage}W ({session.psu.name})")
    if session.cooler:
        parts.append(f"Cooler: {session.cooler.name}")
    if session.storage:
        parts.append(f"Storage: {session.storage.name}")
    if session.case:
        parts.append(f"Case: {session.case.name}")

    build_str = "\n".join(f"  - {p}" for p in parts)
    return (
        f"User Purpose: {purpose_label}\n\n"
        f"Selected Components:\n{build_str}\n\n"
        f"Assess this build for the user's stated purpose. "
        f"Identify any bottlenecks or imbalances. Return ONLY valid JSON."
    )


def _cache_key(session: BuildSession) -> str:
    """Stable cache key based on selected component IDs + purpose."""
    component_ids = sorted(filter(None, [
        str(session.cpu_id) if session.cpu_id else None,
        str(session.gpu_id) if session.gpu_id else None,
        str(session.motherboard_id) if session.motherboard_id else None,
        str(session.ram_id) if session.ram_id else None,
        str(session.psu_id) if session.psu_id else None,
        str(session.cooler_id) if session.cooler_id else None,
        str(session.storage_id) if session.storage_id else None,
        str(session.case_id) if session.case_id else None,
    ]))
    raw = json.dumps(component_ids) + (session.purpose or "")
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"assess:{digest}"


class AIAssessmentService:
    """
    Calls Gemini to evaluate a BuildSession for bottlenecks and purpose-alignment.
    Returns a structured JSON assessment with a green/yellow/red indicator.
    Never blocks the builder — always returns a valid result (fallback on error).
    """

    @staticmethod
    def assess(session: BuildSession) -> dict:
        # Require at least CPU + GPU for a meaningful assessment
        if not session.cpu or not session.gpu:
            return FALLBACK_ASSESSMENT

        cache_key = _cache_key(session)
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            result = AIAssessmentService._call_gemini(session)
            cache.set(cache_key, result, ASSESSMENT_TTL)
            return result
        except Exception as exc:
            logger.warning("AIAssessmentService: Gemini call failed: %s", exc)
            return FALLBACK_ASSESSMENT

    @staticmethod
    def _call_gemini(session: BuildSession) -> dict:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")

        client = genai.Client(api_key=api_key)
        prompt = _build_prompt(session)

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=ASSESSMENT_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ASSESSMENT_SCHEMA,
                temperature=0.2,
                max_output_tokens=300,
            ),
        )

        raw = response.text.strip()
        result = json.loads(raw)

        # Validate required keys are present
        for key in ("overall_color", "headline", "analysis", "actionable_advice", "flagged_components"):
            if key not in result:
                result[key] = FALLBACK_ASSESSMENT[key]

        # Sanitise color value
        if result.get("overall_color") not in ("green", "yellow", "red"):
            result["overall_color"] = "green"

        return result
