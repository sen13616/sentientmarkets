import json
import os
import sys
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY     = os.getenv("FMP_API_KEY")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "fmp_output.txt")


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

print("=== Financial Modeling Prep (FMP) data validation ===\n")


def check_response(response):
    """Return parsed JSON or None, printing warnings on failure."""
    if response.status_code != 200:
        print(f"  *** REQUEST FAILED: status {response.status_code}")
        print(f"  Response text: {response.text}")
        return None
    data = response.json()
    if isinstance(data, list) and len(data) == 0:
        print("  *** WARNING: Empty list returned")
        return None
    if isinstance(data, dict) and "error" in data:
        print(f"  *** API ERROR: {data['error']}")
        return None
    return data


# Test 1: Stock news with sentiment for AAPL — latest 5 articles and available fields
print("--- Stock News + Sentiment: AAPL (5 most recent) ---")
news_data = None
try:
    response = requests.get(
        "https://financialmodelingprep.com/api/v3/stock_news",
        params={"tickers": "AAPL", "limit": 5, "apikey": API_KEY},
        timeout=10,
    )
    news_data = check_response(response)
    if news_data:
        print(f"  Keys in first article: {list(news_data[0].keys())}\n")
        for i, article in enumerate(news_data):
            print(f"  [{i + 1}] title:         {article.get('title')}")
            print(f"       publishedDate: {article.get('publishedDate')}")
            print(f"       site:          {article.get('site')}")
            print(f"       sentiment:     {article.get('sentiment')}")
            print(f"       url:           {article.get('url')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 2: Historical social sentiment for AAPL — Reddit/Twitter mentions and sentiment scores over time
print("--- Social Sentiment History: AAPL (last 10 records) ---")
try:
    response = requests.get(
        "https://financialmodelingprep.com/api/v4/social-sentiment",
        params={"symbol": "AAPL", "limit": 10, "apikey": API_KEY},
        timeout=10,
    )
    data = check_response(response)
    if data:
        for i, record in enumerate(data):
            print(f"  [{i + 1}]")
            for key, value in record.items():
                print(f"    {key}: {value}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 3: Analyst grades consensus for AAPL — aggregated buy/hold/sell counts from analyst ratings
print("--- Analyst Grades Consensus: AAPL ---")
try:
    response = requests.get(
        "https://financialmodelingprep.com/stable/grades-consensus",
        params={"symbol": "AAPL", "apikey": API_KEY},
        timeout=10,
    )
    data = check_response(response)
    if data:
        records = data if isinstance(data, list) else [data]
        for record in records:
            for key, value in record.items():
                print(f"  {key}: {value}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 4: Insider trading for AAPL — recent buys/sells reported by insiders
print("--- Insider Trading: AAPL (10 most recent) ---")
try:
    response = requests.get(
        "https://financialmodelingprep.com/api/v4/insider-trading",
        params={"symbol": "AAPL", "limit": 10, "apikey": API_KEY},
        timeout=10,
    )
    data = check_response(response)
    if data:
        for i, trade in enumerate(data):
            print(f"  [{i + 1}] date:                 {trade.get('transactionDate') or trade.get('date')}")
            print(f"       reportingName:        {trade.get('reportingName')}")
            print(f"       transactionType:      {trade.get('transactionType')}")
            print(f"       securitiesTransacted: {trade.get('securitiesTransacted')}")
            print(f"       price:                {trade.get('price')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 5: Earnings surprises for AAPL — actual vs estimated EPS and the delta for last 5 quarters
print("--- Earnings Surprises: AAPL (last 5 quarters) ---")
try:
    response = requests.get(
        "https://financialmodelingprep.com/api/v3/earnings-surprises/AAPL",
        params={"apikey": API_KEY},
        timeout=10,
    )
    data = check_response(response)
    if data:
        for record in data[:5]:
            actual    = record.get("actualEarningResult")
            estimated = record.get("estimatedEarning")
            try:
                delta = round(actual - estimated, 4) if actual is not None and estimated is not None else "N/A"
            except Exception:
                delta = "N/A"
            print(f"  date:     {record.get('date')}")
            print(f"  actual:   {actual}")
            print(f"  estimate: {estimated}")
            print(f"  delta:    {delta}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 6: Stock news sentiment RSS feed — general market news with FMP's own sentiment scoring
print("--- Stock News Sentiment RSS Feed (first 5 results) ---")
try:
    response = requests.get(
        "https://financialmodelingprep.com/api/v4/stock-news-sentiments-rss-feed",
        params={"page": 0, "apikey": API_KEY},
        timeout=10,
    )
    data = check_response(response)
    if data:
        for i, item in enumerate(data[:5]):
            print(f"  [{i + 1}]")
            for key, value in item.items():
                print(f"    {key}: {value}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 7: Raw response sample — complete JSON of the first article from section 1
print("--- Raw JSON: First Result from Section 1 ---")
try:
    print(json.dumps(news_data[0], indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
