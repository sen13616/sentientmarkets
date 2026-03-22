import json
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

WSB_URL     = "https://apewisdom.io/api/v1.0/filter/wallstreetbets"
REDDIT_URL  = "https://apewisdom.io/api/v1.0/filter/all-reddit"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "apewisdom_output.txt")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

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

print("=== ApeWisdom data validation ===\n")


def print_results(results, limit=10):
    for item in results[:limit]:
        print(f"  rank:               {item.get('rank')}")
        print(f"  ticker:             {item.get('ticker')}")
        print(f"  name:               {item.get('name')}")
        print(f"  mentions:           {item.get('mentions')}")
        print(f"  upvotes:            {item.get('upvotes')}")
        print(f"  rank_24h_ago:       {item.get('rank_24h_ago')}")
        print(f"  mentions_24h_ago:   {item.get('mentions_24h_ago')}")
        print()


# Fetch WallStreetBets data once — reused for sections 1, 3, 4, and 5
wsb_data = None
try:
    response = requests.get(WSB_URL, headers=HEADERS, timeout=10)
    if response.status_code != 200:
        print(f"  *** WSB REQUEST FAILED: status {response.status_code}")
        print(f"  Response text: {response.text}")
    else:
        wsb_data = response.json()
except Exception as e:
    print(f"  ERROR fetching WSB data: {e}")

# Fetch all-Reddit data once — reused for section 2
reddit_data = None
try:
    response = requests.get(REDDIT_URL, headers=HEADERS, timeout=10)
    if response.status_code != 200:
        print(f"  *** ALL-REDDIT REQUEST FAILED: status {response.status_code}")
        print(f"  Response text: {response.text}")
    else:
        reddit_data = response.json()
except Exception as e:
    print(f"  ERROR fetching all-Reddit data: {e}")

print()

# Test 1: WallStreetBets top mentions — most discussed tickers on WSB right now
print("--- WallStreetBets: Top 10 Mentions ---")
try:
    print_results(wsb_data.get("results", []), limit=10)
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 2: All-Reddit top mentions — most discussed tickers across all tracked subreddits
print("--- All Reddit: Top 10 Mentions ---")
try:
    print_results(reddit_data.get("results", []), limit=10)
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 3: AAPL lookup — check whether AAPL appears anywhere in the full WSB result set
print("--- AAPL in WallStreetBets Results ---")
try:
    results = wsb_data.get("results", [])
    aapl = next((item for item in results if item.get("ticker") == "AAPL"), None)
    if aapl:
        print(f"  AAPL found:")
        print(f"    rank:             {aapl.get('rank')}")
        print(f"    mentions:         {aapl.get('mentions')}")
        print(f"    upvotes:          {aapl.get('upvotes')}")
        print(f"    rank_24h_ago:     {aapl.get('rank_24h_ago')}")
        print(f"    mentions_24h_ago: {aapl.get('mentions_24h_ago')}")
    else:
        print("  AAPL not in top results")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 4: Pagination info — understand total available data and page structure
print("--- Pagination Info (WallStreetBets response) ---")
try:
    print(f"  count:        {wsb_data.get('count')}")
    print(f"  pages:        {wsb_data.get('pages')}")
    print(f"  current_page: {wsb_data.get('current_page')}")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 5: Raw first result — full JSON of the top WSB entry to inspect every field
print("--- Raw JSON: First WallStreetBets Result ---")
try:
    first = wsb_data["results"][0]
    print(json.dumps(first, indent=2))
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
