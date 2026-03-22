from pydantic import BaseModel
from typing import Optional, List


class PriceData(BaseModel):
    current_price: Optional[float] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    previous_close: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    average_volume: Optional[int] = None
    pre_market_price: Optional[float] = None
    post_market_price: Optional[float] = None
    post_market_change_percent: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    day_range: Optional[str] = None
    week_52_range: Optional[str] = None


class Fundamentals(BaseModel):
    market_cap: Optional[int] = None
    pe_ratio_trailing: Optional[float] = None
    pe_ratio_forward: Optional[float] = None
    eps_trailing: Optional[float] = None
    eps_forward: Optional[float] = None
    revenue_ttm: Optional[int] = None
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None
    profit_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    gross_margin: Optional[float] = None
    return_on_equity: Optional[float] = None
    return_on_assets: Optional[float] = None
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    free_cash_flow: Optional[int] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    book_value: Optional[float] = None
    price_to_book: Optional[float] = None
    price_to_sales: Optional[float] = None


class EarningsSurprise(BaseModel):
    period: Optional[str] = None
    actual: Optional[float] = None
    estimate: Optional[float] = None
    surprise_percent: Optional[float] = None


class AnalystData(BaseModel):
    consensus: Optional[str] = None
    mean_score: Optional[float] = None
    number_of_analysts: Optional[int] = None
    strong_buy: Optional[int] = None
    buy: Optional[int] = None
    hold: Optional[int] = None
    sell: Optional[int] = None
    strong_sell: Optional[int] = None
    price_target_mean: Optional[float] = None
    price_target_high: Optional[float] = None
    price_target_low: Optional[float] = None
    price_target_median: Optional[float] = None
    upside_to_target_percent: Optional[float] = None
    earnings_surprises: Optional[List[EarningsSurprise]] = None


class TechnicalIndicators(BaseModel):
    rsi_14: Optional[float] = None
    rsi_signal: Optional[str] = None
    fifty_day_ma: Optional[float] = None
    two_hundred_day_ma: Optional[float] = None
    price_vs_50d_ma_percent: Optional[float] = None
    price_vs_200d_ma_percent: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None


class NewsArticle(BaseModel):
    title: Optional[str] = None
    source: Optional[str] = None
    published_at: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    relevance_score: Optional[float] = None
    url: Optional[str] = None


class NewsSentiment(BaseModel):
    source: Optional[str] = None
    articles_analyzed: Optional[int] = None
    average_sentiment_score: Optional[float] = None
    average_sentiment_label: Optional[str] = None
    bullish_count: Optional[int] = None
    neutral_count: Optional[int] = None
    bearish_count: Optional[int] = None
    articles: Optional[List[NewsArticle]] = None


class RedditSentiment(BaseModel):
    source: Optional[str] = None
    current_rank: Optional[int] = None
    rank_24h_ago: Optional[int] = None
    rank_change: Optional[int] = None
    rank_change_direction: Optional[str] = None
    mentions_24h: Optional[int] = None
    mentions_24h_ago: Optional[int] = None
    mention_change_percent: Optional[float] = None
    upvotes_24h: Optional[int] = None
    momentum_signal: Optional[str] = None


class SearchTrends(BaseModel):
    source: Optional[str] = None
    current_interest: Optional[int] = None
    interest_7d_ago: Optional[int] = None
    interest_change_percent: Optional[float] = None
    trend_direction: Optional[str] = None
    related_rising_queries: Optional[List[str]] = None


class InsiderMonthly(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    mspr: Optional[float] = None
    change: Optional[int] = None


class InsiderSentiment(BaseModel):
    source: Optional[str] = None
    latest_mspr: Optional[float] = None
    latest_month: Optional[str] = None
    latest_change: Optional[int] = None
    signal: Optional[str] = None
    history: Optional[List[InsiderMonthly]] = None


class SocialSentiment(BaseModel):
    reddit: Optional[RedditSentiment] = None
    search_trends: Optional[SearchTrends] = None
    insider_sentiment: Optional[InsiderSentiment] = None


class TopHolder(BaseModel):
    holder: Optional[str] = None
    percent_held: Optional[float] = None
    shares: Optional[int] = None
    change_percent: Optional[float] = None


class InstitutionalData(BaseModel):
    source: Optional[str] = None
    percent_held_by_institutions: Optional[float] = None
    percent_held_by_insiders: Optional[float] = None
    short_ratio: Optional[float] = None
    short_percent_of_float: Optional[float] = None
    shares_short: Optional[int] = None
    shares_short_prior_month: Optional[int] = None
    short_interest_change_percent: Optional[float] = None
    top_holders: Optional[List[TopHolder]] = None


class FearGreedSubIndicator(BaseModel):
    score: Optional[float] = None
    label: Optional[str] = None


class FearGreedSubIndicators(BaseModel):
    market_momentum: Optional[FearGreedSubIndicator] = None
    stock_price_strength: Optional[FearGreedSubIndicator] = None
    stock_price_breadth: Optional[FearGreedSubIndicator] = None
    put_call_ratio: Optional[FearGreedSubIndicator] = None
    market_volatility: Optional[FearGreedSubIndicator] = None
    junk_bond_demand: Optional[FearGreedSubIndicator] = None
    safe_haven_demand: Optional[FearGreedSubIndicator] = None


class FearAndGreed(BaseModel):
    source: Optional[str] = None
    score: Optional[float] = None
    label: Optional[str] = None
    previous_close: Optional[float] = None
    one_week_ago: Optional[float] = None
    one_month_ago: Optional[float] = None
    one_year_ago: Optional[float] = None
    trend: Optional[str] = None
    sub_indicators: Optional[FearGreedSubIndicators] = None


class AIInsights(BaseModel):
    summary: Optional[str] = None
    bull_case: Optional[str] = None
    bear_case: Optional[str] = None
    what_to_watch: Optional[str] = None


class DataFreshness(BaseModel):
    price: Optional[str] = None
    news: Optional[str] = None
    social: Optional[str] = None
    insider: Optional[str] = None
    fear_greed: Optional[str] = None


class SentimentResponse(BaseModel):
    ticker: Optional[str] = None
    company_name: Optional[str] = None
    generated_at: Optional[str] = None
    data_freshness: Optional[DataFreshness] = None
    market_mood_score: Optional[int] = None
    market_mood_label: Optional[str] = None
    market_mood_confidence: Optional[str] = None
    ai_insights: Optional[AIInsights] = None
    price_data: Optional[PriceData] = None
    fundamentals: Optional[Fundamentals] = None
    analyst_data: Optional[AnalystData] = None
    technical_indicators: Optional[TechnicalIndicators] = None
    news_sentiment: Optional[NewsSentiment] = None
    social_sentiment: Optional[SocialSentiment] = None
    institutional_data: Optional[InstitutionalData] = None
    fear_and_greed: Optional[FearAndGreed] = None
