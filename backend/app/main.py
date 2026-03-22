from fastapi import FastAPI
from app.api.routes import health, sentiment, home, search, trending

app = FastAPI(title="TheMarketMood.ai API")

app.include_router(health.router)
app.include_router(sentiment.router)
app.include_router(home.router)
app.include_router(search.router)
app.include_router(trending.router)
