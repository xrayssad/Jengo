"""Compare a verification selfie with the portrait on the uploaded ID.

The model never receives the document number. Its reply is reason codes only,
so a name or ID number cannot be stored from the answer. A person still approves
the blue tick.
"""

from __future__ import annotations

import base64
import json
import os
import re

import httpx

PROMPT = """You compare two images for a marketplace identity check in Tanzania.
Image 1 is a live selfie of the applicant.
Image 2 is the front of the identity document they uploaded.
The applicant says the document type is: {doc_type}.
Accepted portrait documents are a NIDA national ID card, a Tanzanian driving licence, a passport, and a voter card.
A business licence or TIN certificate usually has no portrait. If image 2 is one of those, use unsure.

Decide only whether the face in the selfie is the same person as the portrait printed on the document.
Ignore clothes, background, and lighting.
A photo of a screen, a printout held up as the document, or a document with no portrait is not a match.
Do not transcribe names, ID numbers, dates, addresses, or any other text from either image.
Reply with JSON only, using this shape:
{{"verdict":"match","confidence":0.0,"document_seen":"unknown","reasons":["unsure"]}}
verdict must be match, mismatch, or unsure.
confidence is a number from 0 to 1.
document_seen must be one of: nida, driving_licence, passport, voter_card, business_license, other, unknown.
reasons must contain only these codes: same_face, different_face, document_face_hidden, selfie_face_hidden, not_an_id, screen_photo, photo_of_photo, blurry, document_kind_mismatch.
Use match only when the two faces clearly belong to one person.
Use mismatch when the faces are clearly different people, or the document image is a screen or a photo of a photo.
Use unsure when a face is missing, the image is too blurry, or you cannot tell.
"""

VERDICTS = {"match", "mismatch", "unsure"}
DOCS = {"nida", "driving_licence", "passport", "voter_card", "business_license", "other", "unknown"}
REASONS = {
    "same_face",
    "different_face",
    "document_face_hidden",
    "selfie_face_hidden",
    "not_an_id",
    "screen_photo",
    "photo_of_photo",
    "blurry",
    "document_kind_mismatch",
}
_MAX_BYTES = 4_000_000


def prompt_for(doc_type: str) -> str:
    kind = doc_type if doc_type in DOCS else "unknown"
    return PROMPT.format(doc_type=kind)


def _mime(blob: bytes) -> str:
    if blob.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if blob.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if blob.startswith(b"RIFF") and blob[8:12] == b"WEBP":
        return "image/webp"
    return ""


def parse_face_reply(raw: str) -> dict:
    text = raw.strip()
    fenced = re.search(r"\{.*\}", text, re.DOTALL)
    if not fenced:
        return {"verdict": "unsure", "confidence": 0, "document_seen": "unknown", "reasons": [], "error": "unreadable"}
    try:
        data = json.loads(fenced.group(0))
    except json.JSONDecodeError:
        return {"verdict": "unsure", "confidence": 0, "document_seen": "unknown", "reasons": [], "error": "unreadable"}
    verdict = data.get("verdict") if data.get("verdict") in VERDICTS else "unsure"
    seen = data.get("document_seen") if data.get("document_seen") in DOCS else "unknown"
    try:
        confidence = float(data.get("confidence") or 0)
    except (TypeError, ValueError):
        confidence = 0
    confidence = max(0.0, min(1.0, confidence))
    reasons = []
    for code in data.get("reasons") or []:
        if code in REASONS and code not in reasons:
            reasons.append(code)
    return {
        "verdict": verdict,
        "confidence": round(confidence, 2),
        "document_seen": seen,
        "reasons": reasons[:6],
    }


def _unavailable(error: str) -> dict:
    return {"verdict": "unavailable", "confidence": 0, "document_seen": "unknown", "reasons": [], "error": error}


def _gemini(selfie: bytes, document: bytes, selfie_mime: str, doc_mime: str, doc_type: str) -> dict:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_for(doc_type)},
                    {"inline_data": {"mime_type": selfie_mime, "data": base64.b64encode(selfie).decode()}},
                    {"inline_data": {"mime_type": doc_mime, "data": base64.b64encode(document).decode()}},
                ]
            }
        ],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    response = httpx.post(url, params={"key": key}, json=body, timeout=25)
    response.raise_for_status()
    payload = response.json()
    parts = (((payload.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [])
    text = "\n".join(part.get("text") or "" for part in parts)
    return parse_face_reply(text)


def _openai(selfie: bytes, document: bytes, selfie_mime: str, doc_mime: str, doc_type: str) -> dict:
    key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    def url(blob: bytes, mime: str) -> str:
        return f"data:{mime};base64,{base64.b64encode(blob).decode()}"

    body = {
        "model": model,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_for(doc_type) + "\nImage 1 is the selfie. Image 2 is the document."},
                    {"type": "image_url", "image_url": {"url": url(selfie, selfie_mime)}},
                    {"type": "image_url", "image_url": {"url": url(document, doc_mime)}},
                ],
            }
        ],
    }
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json=body,
        timeout=25,
    )
    response.raise_for_status()
    payload = response.json()
    text = (((payload.get("choices") or [{}])[0].get("message") or {}).get("content") or "")
    return parse_face_reply(text)


def compare_faces(selfie: bytes, document: bytes, doc_type: str) -> dict:
    """Return a verdict. Never raises; the review queue stays usable if the model is down."""
    if not selfie or not document:
        return _unavailable("missing_photo")
    if len(selfie) > _MAX_BYTES or len(document) > _MAX_BYTES:
        return _unavailable("too_large")
    selfie_mime = _mime(selfie)
    doc_mime = _mime(document)
    if not selfie_mime or not doc_mime:
        return _unavailable("unsupported_image")
    try:
        if os.getenv("GEMINI_API_KEY", "").strip():
            return _gemini(selfie, document, selfie_mime, doc_mime, doc_type)
        if os.getenv("OPENAI_API_KEY", "").strip():
            return _openai(selfie, document, selfie_mime, doc_mime, doc_type)
    except Exception:
        return _unavailable("model_failed")
    return _unavailable("no_model")
