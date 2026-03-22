import os
import sys
import time
from dotenv import load_dotenv
from pytrends.request import TrendReq

load_dotenv()

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "google_trends_output.txt")


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

print("=== Google Trends data validation ===\n")

pytrends = TrendReq(hl="en-US", tz=360)

print()

# Test 1: Interest over time — daily search interest for AAPL over the last 90 days
print("--- Interest Over Time: AAPL (last 90 days, daily) ---")
iot_data = None
try:
    pytrends.build_payload(["AAPL"], timeframe="today 3-m")
    iot_data = pytrends.interest_over_time()
    if iot_data.empty:
        print("  Empty response — possible rate limit or no data")
    else:
        print(f"  Shape: {iot_data.shape}")
        print(f"\n  First 10 rows:")
        print(iot_data.head(10).to_string())
        print(f"\n  Last 10 rows:")
        print(iot_data.tail(10).to_string())
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(2)

# Test 2: Related queries — top and rising searches associated with AAPL
print("--- Related Queries: AAPL ---")
try:
    pytrends.build_payload(["AAPL"], timeframe="today 3-m")
    related = pytrends.related_queries()
    top     = related.get("AAPL", {}).get("top")
    rising  = related.get("AAPL", {}).get("rising")

    print("  Top queries:")
    if top is None or top.empty:
        print("    Empty response — possible rate limit or no data")
    else:
        print(top.head(10).to_string(index=False))

    print("\n  Rising queries:")
    if rising is None or rising.empty:
        print("    Empty response — possible rate limit or no data")
    else:
        print(rising.head(10).to_string(index=False))
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(2)

# Test 3: Related topics — top and rising topics associated with AAPL
print("--- Related Topics: AAPL ---")
try:
    pytrends.build_payload(["AAPL"], timeframe="today 3-m")
    topics  = pytrends.related_topics()
    top     = topics.get("AAPL", {}).get("top")
    rising  = topics.get("AAPL", {}).get("rising")

    print("  Top topics:")
    if top is None or top.empty:
        print("    Empty response — possible rate limit or no data")
    else:
        print(top.head(10).to_string(index=False))

    print("\n  Rising topics:")
    if rising is None or rising.empty:
        print("    Empty response — possible rate limit or no data")
    else:
        print(rising.head(10).to_string(index=False))
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(2)

# Test 4: Multi-ticker comparison — relative search interest for AAPL, TSLA, NVDA over 30 days
print("--- Multi-Ticker Comparison: AAPL vs TSLA vs NVDA (last 30 days) ---")
try:
    pytrends.build_payload(["AAPL", "TSLA", "NVDA"], timeframe="today 1-m")
    multi = pytrends.interest_over_time()
    if multi.empty:
        print("  Empty response — possible rate limit or no data")
    else:
        print(f"  Shape: {multi.shape}")
        print(f"\n  Last 10 rows:")
        print(multi.tail(10).to_string())
except Exception as e:
    print(f"  ERROR: {e}")

print()
time.sleep(2)

# Test 5: Raw response check — column names and dtypes from the interest over time dataframe
print("--- Raw Response Check: Column Names and Dtypes ---")
try:
    if iot_data is None or iot_data.empty:
        print("  No data available from section 1 to inspect")
    else:
        print("  Columns and dtypes:")
        print(iot_data.dtypes.to_string())
        print(f"\n  Index name:  {iot_data.index.name}")
        print(f"  Index dtype: {iot_data.index.dtype}")
except Exception as e:
    print(f"  ERROR: {e}")

sys.stdout = sys.__stdout__
_outfile.close()
print(f"Output saved to: {os.path.abspath(OUTPUT_PATH)}")
