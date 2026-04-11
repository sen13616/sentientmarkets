from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    ALPHA_VANTAGE_API_KEY: str = ""
    NEWSAPI_KEY: str = ""
    FINNHUB_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    ENVIRONMENT: str = "development"
    # Comma-separated list of allowed CORS origins, e.g.:
    # "https://themarketmood.ai,https://www.themarketmood.ai"
    # Leave empty to allow only localhost in development.
    CORS_ORIGINS: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_cors_origins(self) -> list[str]:
        if self.CORS_ORIGINS:
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        # Default: localhost only (development)
        return ["http://localhost:3000", "http://localhost:3001"]


settings = Settings()
