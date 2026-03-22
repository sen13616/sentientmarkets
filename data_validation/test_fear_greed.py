import json
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "fear_greed_output.txt")

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

# Browser-like headers to avoid the endpoint blocking the request
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.cnn.com/markets/fear-and-greed",
    "Accept": "application/json, text/plain, */*",
}

print("=== CNN Fear & Greed Index data validation ===\n")

# Fetch once and reuse the response for all sections below
try:
    response = requests.get(URL, headers=HEADERS, timeout=10)

    if response.status_code != 200:
        print(f"  *** REQUEST FAILED: status {response.status_code}")
        print(f"  Response text: {response.text}")
        raise SystemExit

    data = response.json()
except Exception as e:
    print(f"  ERROR fetching data: {e}")
    raise SystemExit

print()

# Test 1: Current Fear & Greed score — the latest index value and sentiment label
print("--- Current Fear & Greed Score ---")
try:
    current = data.get("fear_and_greed", {})
    print(f"  score:     {current.get('score')}")
    print(f"  rating:    {current.get('rating')}")
    print(f"  timestamp: {current.get('timestamp')}")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 2: Historical comparison values — previous close, 1w, 1m, 1y ago
print("--- Historical Comparison Values ---")
try:
    fg = data.get("fear_and_greed", {})
    fields = [
        ("previous_close",         "previous_close_rating"),
        ("previous_1_week",        "previous_1_week_rating"),
        ("previous_1_month",       "previous_1_month_rating"),
        ("previous_1_year",        "previous_1_year_rating"),
    ]
    for score_key, rating_key in fields:
        label = score_key.replace("_", " ")
        print(f"  {label}: {fg.get(score_key)}  ({fg.get(rating_key)})")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 3: Raw full response — every field returned by the endpoint
print("--- Raw Full Response ---")
try:
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
