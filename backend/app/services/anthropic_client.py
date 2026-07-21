"""
Shared AsyncAnthropic client. Constructing one per request (the old pattern
in scorer/mood/deep-analysis/stock_v2) built a fresh httpx pool every call;
memoizing it reuses connections, matching how the Redis client is handled.
"""
from typing import Optional

from anthropic import AsyncAnthropic

from app.config import settings

_client: Optional[AsyncAnthropic] = None


def get_anthropic() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client
