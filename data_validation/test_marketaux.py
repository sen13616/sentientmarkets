import json
import os
import sys
from datetime import datetime, timedelta, timezone
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY     = os.getenv("MARKETAUX_API_KEY")
BASE_URL    = "https://api.marketaux.com/v1"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "marketaux_output.txt")


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

print("=== MarketAux data validation ===\n")


def check_response(response):
    """Print a warning if the response is non-200 or contains an error key."""
    if response.status_code != 200:
        print(f"  *** REQUEST FAILED: status {response.status_code}")
        print(f"  Response text: {response.text}")
        return False
    data = response.json()
    if "error" in data:
        print(f"  *** API ERROR: {data['error']}")
        return False
    return True


# Test 1: News + sentiment for AAPL — articles with per-entity and per-highlight sentiment
print("--- News + Sentiment: AAPL (3 most recent articles) ---")
news_data = None
try:
    params = {
        "symbols":         "AAPL",
        "filter_entities": "true",
        "language":        "en",
        "limit":           3,
        "api_token":       API_KEY,
    }
    response = requests.get(f"{BASE_URL}/news/all", params=params, timeout=10)
    if check_response(response):
        news_data = response.json()
        articles  = news_data.get("data", [])
        print(f"  Articles returned: {len(articles)}")
        print()
        for i, article in enumerate(articles):
            print(f"  [{i + 1}] title:        {article.get('title')}")
            print(f"       source:       {article.get('source')}")
            print(f"       published_at: {article.get('published_at')}")
            print(f"       description:  {article.get('description')}")
            entities = article.get("entities", [])
            if entities:
                print(f"       entities:")
                for ent in entities:
                    print(f"         symbol:          {ent.get('symbol')}")
                    print(f"         sentiment_score: {ent.get('sentiment_score')}")
                    print(f"         match_score:     {ent.get('match_score')}")
                    highlights = ent.get("highlights", [])
                    if highlights:
                        print(f"         highlights:")
                        for h in highlights:
                            print(f"           text:            {h.get('highlight')}")
                            print(f"           sentiment_score: {h.get('sentiment')}")
                            print(f"           found_in:        {h.get('highlighted_in')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 2: Sentiment stats for AAPL — aggregated sentiment metrics over the last 7 days
print("--- Sentiment Stats: AAPL (last 7 days) ---")
try:
    published_after = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M")
    params = {
        "symbols":         "AAPL",
        "published_after": published_after,
        "language":        "en",
        "api_token":       API_KEY,
    }
    response = requests.get(f"{BASE_URL}/entity/stats/aggregation", params=params, timeout=10)
    if check_response(response):
        data = response.json()
        for key, value in data.items():
            print(f"  {key}: {value}")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 3: Trending entities — top US entities by mention count in the last 24 hours
print("--- Trending Entities: US (last 24 hours, min 5 mentions) ---")
try:
    published_after = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M")
    params = {
        "countries":       "us",
        "published_after": published_after,
        "language":        "en",
        "min_doc_count":   5,
        "api_token":       API_KEY,
    }
    response = requests.get(f"{BASE_URL}/entity/trending/aggregation", params=params, timeout=10)
    if check_response(response):
        data    = response.json()
        results = data.get("data", [])
        print(f"  Results returned: {len(results)}")
        print()
        for item in results[:10]:
            for key, value in item.items():
                print(f"  {key}: {value}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 4: Sentiment-filtered news — bearish articles for AAPL (sentiment_score <= -0.1)
print("--- Sentiment-Filtered News: AAPL bearish (sentiment_lte=-0.1, 3 articles) ---")
try:
    params = {
        "symbols":         "AAPL",
        "filter_entities": "true",
        "sentiment_lte":   -0.1,
        "language":        "en",
        "limit":           3,
        "api_token":       API_KEY,
    }
    response = requests.get(f"{BASE_URL}/news/all", params=params, timeout=10)
    if check_response(response):
        data     = response.json()
        articles = data.get("data", [])
        print(f"  Articles returned: {len(articles)}")
        print()
        for i, article in enumerate(articles):
            print(f"  [{i + 1}] title:        {article.get('title')}")
            print(f"       published_at: {article.get('published_at')}")
            entities = article.get("entities", [])
            for ent in entities:
                if ent.get("symbol") == "AAPL":
                    print(f"       AAPL sentiment_score: {ent.get('sentiment_score')}")
            print()
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 5: Raw response sample — complete JSON of the first article from section 1
print("--- Raw JSON: First Article from Section 1 ---")
try:
    first = news_data["data"][0]
    print(json.dumps(first, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
