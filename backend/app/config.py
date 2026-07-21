from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    ALPHA_VANTAGE_API_KEY: str = ""
    FINNHUB_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    # External SentimentAPI (docs/SENTIMENTAPI_CONTRACT.md). PRO_API_KEY is the
    # pro Bearer key; services/sentiment_api.py refuses to call upstream and
    # logs an explicit config error when it is empty (never a silent 401 loop).
    SENTIMENT_API_BASE_URL: str = "https://sentimentapi-p.up.railway.app"
    PRO_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    ENVIRONMENT: str = "development"
    # Comma-separated list of allowed CORS origins, e.g.:
    # "https://themarketmood.ai,https://www.themarketmood.ai"
    # Leave empty to use the default deployed origin list below.
    CORS_ORIGINS: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_cors_origins(self) -> list[str]:
        """Static allowed origins (env override or the deployed defaults).

        Covers production domains and localhost only. Vercel preview URLs
        (variable deploy hash AND variable team slug) are handled separately
        by the allow_origin_regex on the CORSMiddleware in main.py.
        """
        if self.CORS_ORIGINS:
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        # Default: the deployed origin set (kept identical to the list
        # previously hardcoded in main.py).
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://sentientmarkets-ai.vercel.app",
            "https://sentientmarkets2.vercel.app",
            "https://sentientmarkets.vercel.app",
            "https://sentientmarkets-git-main-sen13616.vercel.app",
            "https://themarketmood.ai",
            "https://www.themarketmood.ai",
        ]


settings = Settings()
