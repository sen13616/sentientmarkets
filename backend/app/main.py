import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.api.routes import health, sentiment, home, search, trending
from app.api.routes.deep_analysis import router as deep_analysis_router
from app.api.routes.price_history import router as price_history_router
from app.api.routes.mood import router as mood_router
from app.api.routes.stock_v2 import router as stock_v2_router
from app.api.routes.market_v2 import router as market_v2_router
from app.services.mood import refresh_mood
from app.services.screener import refresh_screener
from app.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(title="TheMarketMood.ai API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    # Vercel preview deploys are https://sentientmarkets-{hash}-{team-slug}
    # .vercel.app where BOTH the deploy hash and the team slug are variable —
    # the hash changes per deploy, and the slug is Vercel-controlled (e.g.
    # "sen13616s-projects" today; changes on rename or personal→team
    # migration), so neither may be hardcoded. Starlette matches this with
    # re.fullmatch, so suffixed lookalike domains cannot sneak through.
    allow_origin_regex=r"https://sentientmarkets-[a-z0-9]+-[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sentiment.router)
app.include_router(home.router)
app.include_router(search.router)
app.include_router(trending.router)
app.include_router(deep_analysis_router)
app.include_router(price_history_router)
app.include_router(mood_router)
app.include_router(stock_v2_router)
app.include_router(market_v2_router)

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def startup():
    scheduler.add_job(refresh_mood, "interval", minutes=15, id="mood_refresh")
    scheduler.add_job(refresh_screener, "interval", minutes=15, id="screener_refresh")
    scheduler.start()
    logger.info("Schedulers started — mood + screener refreshing every 15 minutes")
    # Generate initial payloads on startup (don't block — run in background)
    import asyncio
    asyncio.create_task(refresh_mood())
    asyncio.create_task(refresh_screener())


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
