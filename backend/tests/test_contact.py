"""Route tests for POST /api/contact (Resend send monkeypatched — no network).

Rate limiting is forced down the fail-open path by making the Redis client
factory raise, except in the dedicated 429 test which fakes the pipeline.

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
import pytest
from fastapi.testclient import TestClient

from app.api.routes import contact
from app.config import settings
from app.services import ratelimit
from app.main import app

VALID = {"email": "visitor@example.com", "message": "Hello there", "website": ""}

# Captured before any fixture monkeypatches the module attribute.
_REAL_SEND_EMAIL = contact._send_email


@pytest.fixture
def client(monkeypatch):
    # Redis down -> rate limiter fails open (its documented contract).
    def no_redis():
        raise RuntimeError("redis unavailable in tests")

    monkeypatch.setattr(ratelimit, "get_client", no_redis)

    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_test_key")
    monkeypatch.setattr(settings, "RESEND_FROM", "onboarding@resend.dev")
    monkeypatch.setattr(settings, "CONTACT_INBOX_EMAIL", "owner@example.com")

    # Record sends instead of calling Resend.
    sends: list[dict] = []

    async def fake_send(subject, text, reply_to):
        sends.append({"subject": subject, "text": text, "reply_to": reply_to})
        return True

    monkeypatch.setattr(contact, "_send_email", fake_send)

    c = TestClient(app)
    c.sends = sends
    return c


# ── happy path ───────────────────────────────────────────────────────────────

def test_valid_submission_sends_and_returns_ok(client):
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    assert client.sends == [
        {
            "subject": "SentientMarkets contact — visitor@example.com",
            "text": "Hello there",
            "reply_to": "visitor@example.com",
        }
    ]


def test_email_and_message_are_stripped(client):
    r = client.post(
        "/api/contact",
        json={"email": "  a@b.co  ", "message": "  hi  ", "website": ""},
    )
    assert r.status_code == 200
    assert client.sends[0]["reply_to"] == "a@b.co"
    assert client.sends[0]["text"] == "hi"


def test_extra_fields_are_ignored_not_rejected(client):
    r = client.post("/api/contact", json={**VALID, "unexpected": "field"})
    assert r.status_code == 200
    assert len(client.sends) == 1


# ── honeypot ─────────────────────────────────────────────────────────────────

def test_honeypot_returns_ok_but_sends_nothing(client):
    r = client.post("/api/contact", json={**VALID, "website": "http://spam.example"})
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    assert client.sends == []


def test_honeypot_beats_validation_no_hint_for_bots(client):
    # Even with an invalid email, a filled honeypot gets the human response.
    r = client.post(
        "/api/contact",
        json={"email": "not-an-email", "message": "", "website": "x"},
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    assert client.sends == []


# ── validation ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize("email", [
    "",
    "plainaddress",
    "no@dot",
    "spa ce@b.co",
    "a@b.co" + "x" * 250,  # > 254 chars
])
def test_invalid_email_is_400(client, email):
    r = client.post("/api/contact", json={**VALID, "email": email})
    assert r.status_code == 400
    assert "error" in r.json()
    assert client.sends == []


def test_empty_message_is_400(client):
    r = client.post("/api/contact", json={**VALID, "message": "   "})
    assert r.status_code == 400
    assert client.sends == []


def test_overlong_message_is_400(client):
    r = client.post("/api/contact", json={**VALID, "message": "x" * 5001})
    assert r.status_code == 400
    assert client.sends == []


def test_max_length_message_is_accepted(client):
    r = client.post("/api/contact", json={**VALID, "message": "x" * 5000})
    assert r.status_code == 200
    assert len(client.sends) == 1


# ── failure path ─────────────────────────────────────────────────────────────

def test_send_failure_is_502(client, monkeypatch):
    async def failing_send(subject, text, reply_to):
        return False

    monkeypatch.setattr(contact, "_send_email", failing_send)
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 502
    assert r.json() == {"error": "send_failed"}


def test_unconfigured_resend_is_502_not_crash(client, monkeypatch):
    # Real _send_email with no API key: must refuse to send, never call out.
    monkeypatch.setattr(contact, "_send_email", _REAL_SEND_EMAIL)
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 502
    assert r.json() == {"error": "send_failed"}


# ── rate limiting ────────────────────────────────────────────────────────────

def test_rate_limit_exceeded_is_429(client, monkeypatch):
    class FakePipe:
        def incr(self, key):
            return self

        def expire(self, key, seconds):
            return self

        async def execute(self):
            return (6, True)  # over the 5/hour cap

    class FakeRedis:
        def pipeline(self):
            return FakePipe()

    monkeypatch.setattr(ratelimit, "get_client", lambda: FakeRedis())
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 429
    assert "Retry-After" in r.headers
