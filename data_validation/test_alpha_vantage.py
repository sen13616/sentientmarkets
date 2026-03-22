import os
import sys
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"
TICKER = "AAPL"

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "alpha_vantage_output.txt")

# Redirect stdout to both terminal and file
class Tee:
    def __init__(self, *streams):
        self.streams = streams
    def write(self, data):
        for s in self.streams:
            s.write(data)
    def flush(self):
        for s in self.streams:
            s.flush()

_outfile = open(OUTPUT_PATH, "w")
sys.stdout = Tee(sys.__stdout__, _outfile)

print(f"=== Alpha Vantage data validation for: {TICKER} ===\n")


def check_rate_limit(data):
    """Print a warning if Alpha Vantage returned a rate limit or info message."""
    if "Note" in data:
        print(f"  *** RATE LIMIT WARNING: {data['Note']}")
    if "Information" in data:
        print(f"  *** API INFO: {data['Information']}")


# Test 1: Latest price snapshot — GLOBAL_QUOTE returns the most recent trade data
print("--- GLOBAL_QUOTE (latest price snapshot) ---")
try:
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": TICKER,
        "apikey": API_KEY,
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    check_rate_limit(data)
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 2: Daily OHLCV time series — compact returns the latest ~100 data points
print("--- TIME_SERIES_DAILY (last 30 trading days) ---")
try:
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": TICKER,
        "outputsize": "compact",
        "apikey": API_KEY,
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    check_rate_limit(data)

    # Print metadata and first 30 days of bars; dump full raw data below
    meta = data.get("Meta Data", {})
    time_series = data.get("Time Series (Daily)", {})
    trimmed = {
        "Meta Data": meta,
        "Time Series (Daily) [first 30 days]": dict(list(time_series.items())[:30]),
    }
    print(json.dumps(trimmed, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 3: Company fundamentals — OVERVIEW returns financials, ratios, and metadata
print("--- OVERVIEW (company fundamentals and metadata) ---")
try:
    params = {
        "function": "OVERVIEW",
        "symbol": TICKER,
        "apikey": API_KEY,
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    check_rate_limit(data)
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 4: News and sentiment — returns recent news articles with per-ticker sentiment scores
print("--- NEWS_SENTIMENT (5 most recent articles for AAPL) ---")
try:
    params = {
        "function": "NEWS_SENTIMENT",
        "tickers": TICKER,
        "limit": 5,
        "apikey": API_KEY,
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    check_rate_limit(data)
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 5: RSI technical indicator — 14-period RSI on daily closing price
print("--- RSI (daily, 14-period, close price) ---")
try:
    params = {
        "function": "RSI",
        "symbol": TICKER,
        "interval": "daily",
        "time_period": 14,
        "series_type": "close",
        "apikey": API_KEY,
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    check_rate_limit(data)

    # RSI returns years of history — trim to first 30 entries to keep output readable
    meta = data.get("Meta Data", {})
    rsi_series = data.get("Technical Analysis: RSI", {})
    trimmed = {
        "Meta Data": meta,
        "Technical Analysis: RSI [first 30]": dict(list(rsi_series.items())[:30]),
    }
    print(json.dumps(trimmed, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
