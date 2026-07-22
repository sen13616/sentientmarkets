# APIACESSPAGE.md — Free-tier demo key + contact form

Shared spec for **two separate Claude Code sessions**:

- **Session A — Website** (`sentientmarkets`, `/frontend` + `/backend`): build the `/api-access` page from the HTML draft (`API_Access_draft.html`), the client-side demo-key flow, and the contact form + its send endpoint.
- **Session B — API** (`sentientmarkets-api`): build the demo-key manager — mint endpoint, sliding expiry, and the cleanup job.

Each session implements **only its own section**. Both code against **§3 Interface contract** — that is the agreed boundary; do not change a shape on one side without changing it here first.

---

## 0. What we're building (plain terms)

An anonymous visitor to `/api-access` gets a **working free-tier API key provisioned to their browser** — no signup, no email — so they can copy-paste the example curl and get a real response immediately. The key has a rolling 7-day expiry that extends every time it's used. At the bottom of the page, a contact form emails the site owner.

The demo key **is not an account**. It's a low-stakes sandbox credential. Real accounts, a dashboard, and Pro/billing are explicitly out of scope (§7).

---

## 1. Design decisions — DO NOT "optimize" these away

These are deliberate. If an implementation seems simpler by violating one, that's the bug, not the fix.

1. **One key per browser, reused — NOT a new key on every page load.** The browser persists its key in `localStorage` and reuses it across reloads. A fresh key is minted only when the browser holds none (or an expired one). Rationale: `api_keys` lives on a storage-constrained Postgres, and rate limits are **per key** — minting per page load would grow the table without bound (every visitor, refresh, and bot crawl = a new row) and make the rate limiter meaningless (unlimited keys = unlimited aggregate throughput = a self-inflicted DoS faucet).

2. **Sliding 7-day expiry, implemented for free.** Validity is `expires_at > now()`. On every authenticated request, the **existing `last_used_at` UPDATE** also sets `expires_at = now() + 7 days` for demo keys — one statement, zero extra writes. Used keys stay alive; abandoned keys expire and get pruned.

3. **Demo keys are a distinct `key_type`.** The cleanup job only prunes `key_type='demo'`; it must never touch issued/`standard` keys. The migration is **backwards-compatible**: existing rows default to `standard` with `expires_at = NULL` (never expire, behave exactly as today).

4. **Mint is protected.** Origin allowlist + per-IP mint cap (Redis). Be honest about the threat model: origin headers are spoofable by non-browser clients, so the **per-IP cap + pruning are the real backstops**, not the origin check. If abuse appears, the levers are: lower the IP cap, lower the demo rate limit, or fall back to a single shared demo key (see §1a).

5. **Contact form belongs to the Website side, not the API.** It emails the owner via Resend. The owner's address is an **env var, never hardcoded**.

### 1a. Simpler fallback (optional, owner's call)
If you'd rather ship with zero minting faucet: skip `/v1/demo-key` entirely and embed **one shared free-tier key** in the page, with a tight global rate limit. Trade-off: everyone shares one rate-limit bucket, and it undercuts the "your key" narrative. The spec below assumes the per-browser minted design; note this alternative exists.

---

## 2. Preconditions before this page goes live (GATE)

Do the build now, but **do not flip the page live** until all three hold. Until then, keep it behind a flag / the current "coming soon" treatment.

- [ ] **Rate limiting is actually enforced.** Verify `api/rate_limit.py` is live, not a stub with hardcoded values. A public demo key on an unmetered backend is a cost + DoS risk. (Read-only diagnostic first.)
- [ ] **Storage remediation Phases 0–2 are done** (preflight, market-hours guard, dedupe). Don't open a public key while the DB is in a storage crunch.
- [ ] **The demo-key cleanup job is deployed and verified** to prune expired demo keys and never delete `standard` keys.

---

## 3. Interface contract (both sides code to this)

### 3.1 `POST /v1/demo-key` — provision / refresh a demo key  *(Session B builds; Session A calls)*

Returns a usable free-tier key for the caller's browser.

**Protections**
- **Origin allowlist:** request `Origin` header must be in `SITE_ORIGINS`. Otherwise `403 origin_not_allowed`.
- **Per-IP mint cap:** at most `DEMO_KEY_IP_CAP` *new mints* per `DEMO_KEY_IP_WINDOW` per client IP (Redis counter, reuse rate-limit infra). Read the real client IP from `X-Forwarded-For` (first hop). Validating/extending an existing key does **not** count against the cap.

**Request body**
```json
{ "existing_key": "sk-sm-free-…" | null }
```
The browser sends whatever key it already holds (from `localStorage`), or `null`.

**Behaviour**
- If `existing_key` is present **and** valid (`is_active`, `key_type='demo'`, `expires_at > now()`): **do not mint.** Refresh its expiry and return the *same* key.
- Else: enforce the IP cap, then mint. Generate plaintext `sk-sm-free-<token>` (`secrets.token_urlsafe`), store only its SHA-256 hash with `tier='free'`, `key_type='demo'`, `expires_at = now() + DEMO_KEY_TTL_DAYS`. Return the plaintext **once**.

**200 response**
```json
{
  "api_key": "sk-sm-free-xxxxxxxxxxxxxxxxxxxxxxxx",
  "tier": "free",
  "expires_at": "2026-07-28T09:00:00Z",
  "rate_limit_per_min": 10
}
```

**Errors** (all JSON bodies): `403 origin_not_allowed`; `429 demo_key_rate_limited` (include a retry hint / window). 

**Note:** returning plaintext here is intentional — a demo key is a sandbox credential, unlike Pro keys.

### 3.2 Auth path must respect expiry  *(Session B)*

`api/auth.py` + `db/queries/api_keys.get_key_tier` — a key is valid **iff** `is_active AND (expires_at IS NULL OR expires_at > now())`. Expired demo keys return `401` like any invalid key.

The existing lookup UPDATE (which already sets `last_used_at`) must, in the **same statement**, extend demo-key expiry:
```sql
UPDATE api_keys
   SET last_used_at = now(),
       expires_at   = CASE WHEN key_type = 'demo'
                           THEN now() + interval '7 days'
                           ELSE expires_at END
 WHERE key_hash   = $1
   AND is_active  = TRUE
   AND (expires_at IS NULL OR expires_at > now())
RETURNING tier;
```
Returning no row (expired / inactive / absent) → the caller raises `401`. `standard` keys keep `expires_at = NULL` and are unaffected.

### 3.3 `POST /api/contact` — email the owner  *(Session A builds)*

Route Handler (`app/api/contact`) or the FastAPI `/backend` — match whatever the site already uses for server calls.

**Body**
```json
{ "email": "you@example.com", "message": "…", "website": "" }
```
`website` is a **honeypot** — must be empty.

**Validation**
- Valid email format; `message` length 1–5000.
- Honeypot non-empty → return `200 {"ok": true}` and send nothing (silent bot drop).
- Per-IP submit cap (it's a public endpoint that sends email — spam risk).

**Action:** send an email to `CONTACT_INBOX_EMAIL` via Resend. Set **reply-to = submitter's email** so the owner can reply directly. Subject e.g. `SentientMarkets contact — {email}`.

**Responses:** `200 {"ok": true}`; `400 {"error": "..."}` on validation failure. `RESEND_API_KEY` is server-side only — never exposed to the client.

---

## 4. Session B — API responsibilities (`sentientmarkets-api`)

1. **Migration 005** (`api_keys` extension — backwards-compatible):
   ```sql
   ALTER TABLE api_keys
     ADD COLUMN key_type   VARCHAR(20) NOT NULL DEFAULT 'standard'
       CHECK (key_type IN ('demo','standard')),
     ADD COLUMN expires_at TIMESTAMPTZ NULL;

   -- supports the cleanup job cheaply
   CREATE INDEX idx_api_keys_demo_expiry
     ON api_keys (expires_at) WHERE key_type = 'demo';
   ```
   Existing rows → `standard`, `expires_at NULL` (never expire). The manual keys from `tools/generate_keys.py` are unaffected; optionally set them `key_type='standard'` explicitly.

2. **`POST /v1/demo-key`** per §3.1 — origin allowlist, per-IP cap (Redis), mint-or-extend logic.

3. **Auth + expiry** per §3.2 — update validity check and the `last_used_at` UPDATE.

4. **Cleanup job** — APScheduler job (hourly is fine):
   ```sql
   DELETE FROM api_keys WHERE key_type = 'demo' AND expires_at < now();
   ```
   Log the deleted count. This is what keeps the table bounded — non-negotiable given storage limits.

5. **Config / env:** `SITE_ORIGINS` (comma-separated), `DEMO_KEY_IP_CAP` (default `5`), `DEMO_KEY_IP_WINDOW` (default `86400`), `DEMO_KEY_TTL_DAYS` (default `7`).

6. **Keep storing only the SHA-256 hash.** Plaintext is returned to the caller, never persisted.

7. **Tests:**
   - Mint returns a working free key that authenticates against `/v1/sentiment/{ticker}`.
   - Second call with a valid `existing_key` **does not** create a new row (assert row count unchanged) and pushes `expires_at` forward.
   - A key past `expires_at` → `401`.
   - Exceeding the IP cap → `429`.
   - Cleanup deletes only expired `demo` rows and **never** a `standard` row.

---

## 5. Session A — Website responsibilities (`sentientmarkets`)

1. **Build the `/api-access` page section from `API_Access_draft.html`.** Match the existing light-theme tokens (Coinbase blue `#0052ff`, ink `#0a0b0d`, muted `#5b616e`, lines `#eef0f3`, green `#05b169`, Inter + JetBrains Mono). **Preserve all existing explanatory copy** — the "how it works" steps, the terminal example, the tiers table, the endpoints, "what's behind the numbers", and "fair use & practical notes" are unchanged in substance. The only content additions are the demo-key card and the contact section; the only edits are (a) hero badge → "Free tier live / Pro coming soon", (b) step 1 wording to reflect browser provisioning, (c) the "Keys are secret" note split into demo-vs-Pro.

2. **Demo-key client flow:**
   - On mount, read `sm_demo_key` and `sm_demo_expiry` from `localStorage`.
   - `POST {SENTIMENT_API_BASE}/v1/demo-key` with `{ existing_key }` set to the stored key (or `null`). Store the returned `api_key` + `expires_at`.
   - **Reuse the stored key across reloads** — never mint a fresh key just because the page loaded.
   - Inject the key into the "Your free key" card **and** the example curl block so copy-paste works out of the box.
   - **Handle `429` gracefully:** show something like "You've created the maximum demo keys for now — reuse the one you have, or try again later." Do **not** retry in a loop.
   - **Regenerate** button: clear the stored key, then `POST` for a new one (subject to the cap).

3. **Contact form** per §3.3 — POST to `/api/contact`, include the honeypot field, render success/error states in the interface's own voice (no apologies, say what to do next).

4. **Env:** `SENTIMENT_API_BASE` (reuse the existing one if present), `CONTACT_INBOX_EMAIL`, `RESEND_API_KEY` (server-side only), `RESEND_FROM` (a verified sender, or Resend's onboarding sender pre-domain-cutover).

5. **Security:** the demo key is safe to display (sandbox). Never display or log a Pro key. Never expose `RESEND_API_KEY` to the browser. The only mint endpoint the client ever calls is `/v1/demo-key`.

---

## 6. Env & secrets summary

| Side | Var | Default / note |
|---|---|---|
| API | `SITE_ORIGINS` | comma-separated allowlist of the site's origins |
| API | `DEMO_KEY_IP_CAP` | `5` new mints per window per IP |
| API | `DEMO_KEY_IP_WINDOW` | `86400` seconds |
| API | `DEMO_KEY_TTL_DAYS` | `7` |
| Web | `SENTIMENT_API_BASE` | reuse existing if set |
| Web | `CONTACT_INBOX_EMAIL` | owner inbox (never hardcode) |
| Web | `RESEND_API_KEY` | server-side only |
| Web | `RESEND_FROM` | verified/onboarding sender |

---

## 7. Out of scope (future, do not build now)

Real user accounts, login, per-user dashboard, key-management UI, Pro keys, billing. The demo key is deliberately account-less. When accounts land later, `standard` keys get tied to a `user_id` (add a `users` table + FK at that point) — the current schema is compatible with that.

---

## 8. Operating constraints (both sessions)

- Start every implementation prompt with `git branch --show-current` and **hard-stop** if not on the intended branch.
- **No git commands inside Claude Code** — the owner commits and pushes manually.
- **One Claude Code session per repo at a time.**
- **Read-only diagnostic pass before writing**, especially: confirm whether `api/rate_limit.py` actually enforces limits, and whether the current "notify"/contact path has any existing backend.
- Commit with explicit filenames.

---

## 9. Known doc discrepancy to reconcile (not blocking)

Page copy states **Pro = 600 req/min**; `API.md` / code state **Pro = 120 req/min**. Free = 10/min is consistent everywhere (and is what the demo key uses). Pick one before Pro launches — it doesn't affect this build.
