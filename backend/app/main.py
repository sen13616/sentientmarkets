import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.api.routes import health, sentiment, home, search
from app.api.routes.contact import router as contact_router
from app.api.routes.deep_analysis import router as deep_analysis_router
from app.api.routes.price_history import router as price_history_router
from app.api.routes.mood import router as mood_router
from app.api.routes.stock_v2 import router as stock_v2_router
from app.api.routes.market_v2 import router as market_v2_router
from app.services.mood import refresh_mood
from app.services.ratelimit import rate_limit
from app.services.screener import refresh_screener
from app.services.singleflight import coalesce
from app.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Strong refs: the event loop only weak-refs tasks, so fire-and-forget
# create_task results could in principle be GC'd mid-flight.
_startup_tasks: set[asyncio.Task] = set()


async def _scheduled_mood_refresh():
    # Shares the coalescing key with /api/mood's cold path so the scheduled
    # job and request-triggered refreshes serialize — the mood:history
    # read-modify-write can never interleave.
    await coalesce("mood:refresh", refresh_mood)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(_scheduled_mood_refresh, "interval", minutes=60, id="mood_refresh")
    scheduler.add_job(refresh_screener, "interval", minutes=15, id="screener_refresh")
    scheduler.start()
    logger.info("Schedulers started — mood refreshing every 60 minutes, screener every 15 minutes")
    # Generate initial payloads on startup (don't block — run in background)
    for coro in (_scheduled_mood_refresh(), refresh_screener()):
        task = asyncio.create_task(coro)
        _startup_tasks.add(task)
        task.add_done_callback(_startup_tasks.discard)
    yield
    scheduler.shutdown()


app = FastAPI(title="TheMarketMood.ai API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    # Vercel preview deploys are https://sentientmarkets-{hash}-{scope}
    # .vercel.app. The deploy hash is variable, but the scope slug is pinned:
    # project names are only unique per Vercel account, so a hash-only pattern
    # would match any stranger's project named "sentientmarkets". Update the
    # slug here if the Vercel account is renamed or migrated to a team.
    # Starlette matches with re.fullmatch, so suffixed lookalike domains
    # cannot sneak through.
    allow_origin_regex=r"https://sentientmarkets-[a-z0-9]+-sen13616s-projects\.vercel\.app",
    # The API is anonymous — no cookies or auth headers to share, so never
    # grant credentialed CORS.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Browser-side HTTP caching ────────────────────────────────────────────
# Redis is the authoritative cache; these headers just let the browser skip
# re-downloading a payload Redis would serve identically anyway (e.g. when a
# user navigates home → stock → home). max-age is deliberately a fraction of
# each route's Redis TTL so the two staleness windows don't stack up, with
# stale-while-revalidate letting the browser refresh in the background.
# Rules are (predicate, header) checked in order; first match wins.
_CACHE_RULES: list[tuple] = [
    (lambda p: p == "/api/health", "no-store"),
    (lambda p: p == "/api/mood", "public, max-age=900, stale-while-revalidate=1800"),
    (lambda p: p == "/api/home", "public, max-age=300, stale-while-revalidate=600"),
    (lambda p: p.startswith("/api/search"), "public, max-age=3600"),
    (lambda p: p.startswith("/api/sentiment/"), "public, max-age=600, stale-while-revalidate=1200"),
    (lambda p: p.startswith("/api/price-history/"), "public, max-age=300, stale-while-revalidate=600"),
    (lambda p: p.startswith("/api/v2/market/"), "public, max-age=300, stale-while-revalidate=600"),
    (lambda p: p.startswith("/api/v2/stock/") and p.endswith("/quote"), "public, max-age=120, stale-while-revalidate=300"),
    (lambda p: p.startswith("/api/v2/stock/") and p.endswith("/news"), "public, max-age=900, stale-while-revalidate=1800"),
    (lambda p: p.startswith("/api/v2/stock/"), "public, max-age=300, stale-while-revalidate=600"),
]


@app.middleware("http")
async def cache_control_headers(request, call_next):
    response = await call_next(request)
    # Only successful GETs are cacheable; never override an explicit header —
    # routes deliberately set Cache-Control: no-store on 200s that carry
    # error-ish bodies (unknown ticker, null insight, fallback mood).
    if (
        request.method == "GET"
        and response.status_code == 200
        and "cache-control" not in response.headers
    ):
        path = request.url.path
        for matches, header in _CACHE_RULES:
            if matches(path):
                response.headers["Cache-Control"] = header
                break
    return response


# Per-IP rate limits (services/ratelimit.py). Expensive routes — the ones a
# cache miss turns into a Claude call or full upstream fan-out — carry their
# own tighter limits on the route decorators (deep-analysis 10/min, v1
# sentiment 20/min); everything else shares a generous abuse ceiling.
_CHEAP = [Depends(rate_limit(120, 60, "cheap"))]

app.include_router(health.router)
app.include_router(sentiment.router)
app.include_router(home.router, dependencies=_CHEAP)
app.include_router(search.router, dependencies=[Depends(rate_limit(60, 60, "search"))])
app.include_router(deep_analysis_router)
app.include_router(price_history_router, dependencies=_CHEAP)
app.include_router(mood_router, dependencies=_CHEAP)
app.include_router(stock_v2_router, dependencies=_CHEAP)
app.include_router(market_v2_router, dependencies=_CHEAP)
# Sends email — tight per-IP cap lives on the route itself (5/hour).
app.include_router(contact_router)
