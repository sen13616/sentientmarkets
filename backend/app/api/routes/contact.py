"""
POST /api/contact — the /api-access contact form (APIACESSPAGE.md §3.3).

Sends the visitor's message to CONTACT_INBOX_EMAIL via Resend's REST API,
with reply-to set to the submitter so the owner can answer directly. The
`website` field is a honeypot: bots that fill it get a silent 200 and no
email. Validation failures return 400 with a JSON error body (the client
renders it), not FastAPI's 422 — hence plain str fields + manual checks.
"""
import logging
import re

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from app.config import settings
from app.services.ratelimit import rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

# Deliberately loose: one @, no whitespace, a dot in the domain. Real
# verification happens when the owner hits reply — this only keeps the
# reply-to header and subject line well-formed.
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_MAX_MESSAGE_LEN = 5000

_RESEND_URL = "https://api.resend.com/emails"


class ContactRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: str = ""
    message: str = ""
    website: str = ""  # honeypot — humans never see or fill this field


async def _send_email(subject: str, text: str, reply_to: str) -> bool:
    """POST to Resend. Returns True on 2xx; logs and returns False otherwise."""
    if not settings.RESEND_API_KEY or not settings.CONTACT_INBOX_EMAIL:
        logger.error(
            "contact form not configured: RESEND_API_KEY and CONTACT_INBOX_EMAIL "
            "must both be set"
        )
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                _RESEND_URL,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": settings.RESEND_FROM,
                    "to": [settings.CONTACT_INBOX_EMAIL],
                    "reply_to": reply_to,
                    "subject": subject,
                    "text": text,
                },
            )
    except Exception as exc:
        logger.error("contact email send failed: %s", exc)
        return False
    if resp.status_code >= 300:
        logger.error(
            "contact email rejected by Resend: %s %s",
            resp.status_code,
            resp.text[:500],
        )
        return False
    return True


def _bad_request(error: str) -> JSONResponse:
    return JSONResponse(status_code=400, content={"error": error})


@router.post("/api/contact", dependencies=[Depends(rate_limit(5, 3600, "contact"))])
async def contact(req: ContactRequest):
    # Honeypot before validation: a bot must get the same response a human
    # would, never a validation hint.
    if req.website.strip():
        return {"ok": True}

    email = req.email.strip()
    message = req.message.strip()
    if not email or len(email) > 254 or not _EMAIL_RE.match(email):
        return _bad_request("Enter a valid email address.")
    if not message:
        return _bad_request("Message can't be empty.")
    if len(message) > _MAX_MESSAGE_LEN:
        return _bad_request(f"Message is too long (max {_MAX_MESSAGE_LEN} characters).")

    sent = await _send_email(
        subject=f"SentientMarkets contact — {email}",
        text=message,
        reply_to=email,
    )
    if not sent:
        return JSONResponse(status_code=502, content={"error": "send_failed"})
    return {"ok": True}
