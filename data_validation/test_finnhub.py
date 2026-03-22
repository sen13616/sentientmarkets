import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY     = os.getenv("FINNHUB_API_KEY")
BASE_URL    = "https://finnhub.io/api/v1"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "finnhub_output.txt")

TODAY     = datetime.now(timezone.utc).strftime("%Y-%m-%d")
WEEK_AGO  = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")


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

print("=== Finnhub data validation for: AAPL ===\n")


def get(endpoint, params):
    """Make a GET request with the API token and return parsed JSON or None."""
    params["token"] = API_KEY
    response = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
    if response.status_code != 200:
        print(f"  *** REQUEST FAILED: status {response.status_code}")
        print(f"  Response text: {response.text}")
        return None
    data = response.json()
    if isinstance(data, list) and len(data) == 0:
        print("  *** WARNING: Empty list returned")
        return None
    if isinstance(data, dict) and data.get("error"):
        print(f"  *** API ERROR: {data['error']}")
        return None
    return data


# Test 1: Company news — recent headlines for AAPL with sentiment if available
print("--- Company News: AAPL (last 7 days, first 5 articles) ---")
news_data = None
try:
    data = get("/company-news", {"symbol": "AAPL", "from": WEEK_AGO, "to": TODAY})
    if data:
        news_data = data
        print(f"  Total articles returned: {len(data)}")
        print(f"  Keys in first article:   {list(data[0].keys())}\n")
        for i, article in enumerate(data[:5]):
            print(f"  [{i + 1}] headline:  {article.get('headline')}")
            print(f"       source:    {article.get('source')}")
            print(f"       datetime:  {datetime.fromtimestamp(article.get('datetime', 0), tz=timezone.utc).isoformat()}")
            print(f"       sentiment: {article.get('sentiment')}")
            print(f"       url:       {article.get('url')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 2: Social sentiment — Reddit and Twitter mention counts and sentiment scores for AAPL
print("--- Social Sentiment: AAPL (last 7 days) ---")
social_data = None
try:
    data = get("/stock/social-sentiment", {"symbol": "AAPL", "from": WEEK_AGO})
    if data:
        social_data = data
        for platform in ("reddit", "twitter"):
            records = data.get(platform, [])
            print(f"  {platform.capitalize()} ({len(records)} records):")
            for record in records[:5]:
                for key, value in record.items():
                    print(f"    {key}: {value}")
                print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 3: Insider sentiment — Monthly Share Purchase Ratio (MSPR) indicating insider buy/sell pressure
print("--- Insider Sentiment / MSPR: AAPL (2025-01-01 to today) ---")
try:
    data = get("/stock/insider-sentiment", {"symbol": "AAPL", "from": "2025-01-01", "to": TODAY})
    if data:
        records = data.get("data", [])
        print(f"  Records returned: {len(records)}")
        print()
        for record in records[-6:]:
            print(f"  year:   {record.get('year')}")
            print(f"  month:  {record.get('month')}")
            print(f"  change: {record.get('change')}")
            print(f"  mspr:   {record.get('mspr')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 4: Earnings surprises — actual vs estimated EPS and surprise metrics for last 5 quarters
print("--- Earnings Surprises: AAPL (last 5 quarters) ---")
try:
    data = get("/stock/earnings", {"symbol": "AAPL"})
    if data:
        print(f"  Records returned: {len(data)}")
        print()
        for record in data[:5]:
            actual   = record.get("actual")
            estimate = record.get("estimate")
            print(f"  period:          {record.get('period')}")
            print(f"  actual:          {actual}")
            print(f"  estimate:        {estimate}")
            print(f"  surprise:        {record.get('surprise')}")
            print(f"  surprisePercent: {record.get('surprisePercent')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 5: SEC filing sentiment — fetch the latest filing access number then pull its sentiment
print("--- SEC Filing Sentiment: AAPL (latest filing) ---")
try:
    # Step 1: get the most recent SEC filing to extract its access number
    filings = get("/stock/filings", {"symbol": "AAPL", "limit": 1})
    if filings:
        latest        = filings[0]
        access_number = latest.get("accessNumber")
        print(f"  Latest filing:")
        print(f"    form:         {latest.get('form')}")
        print(f"    filedDate:    {latest.get('filedDate')}")
        print(f"    accessNumber: {access_number}")
        print()

        # Step 2: fetch sentiment for that specific filing
        if access_number:
            time.sleep(1)
            sentiment = get("/stock/filings-sentiment", {"accessNumber": access_number})
            if sentiment:
                print(f"  Filing sentiment:")
                for key, value in sentiment.items():
                    print(f"    {key}: {value}")
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(1)

# Test 6: Basic quote — current price snapshot for AAPL
print("--- Quote: AAPL ---")
try:
    data = get("/quote", {"symbol": "AAPL"})
    if data:
        for key, value in data.items():
            print(f"  {key}: {value}")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 7: Raw response samples — full JSON from section 1 (news) and section 2 (social sentiment)
print("--- Raw JSON: First Article from Section 1 ---")
try:
    print(json.dumps(news_data[0], indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

print()
print("--- Raw JSON: Full Social Sentiment Response from Section 2 ---")
try:
    print(json.dumps(social_data, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
