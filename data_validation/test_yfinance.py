import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

TICKER = "AAPL"
ticker = yf.Ticker(TICKER)

print(f"=== yfinance data validation for: {TICKER} ===\n")

# Test 1: Basic metadata and company info returned by yfinance
print("--- ticker.info ---")
try:
    info = ticker.info
    for key, value in info.items():
        print(f"  {key}: {value}")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 2: Historical OHLCV price data — daily bars for the last 30 days
print("--- Historical OHLCV (last 30 days, daily) ---")
try:
    hist = ticker.history(period="1mo", interval="1d")
    print(hist.to_string())
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 3: Income statement — annual and quarterly available via .income_stmt / .quarterly_income_stmt
print("--- Income Statement (annual) ---")
try:
    income = ticker.income_stmt
    print(income.to_string())
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 4: Balance sheet — snapshot of assets, liabilities, equity
print("--- Balance Sheet (annual) ---")
try:
    balance = ticker.balance_sheet
    print(balance.to_string())
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 5: Cash flow statement — operating, investing, financing activities
print("--- Cash Flow Statement (annual) ---")
try:
    cashflow = ticker.cashflow
    print(cashflow.to_string())
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 6: Options expiration dates available for this ticker
print("--- Options Expiration Dates ---")
try:
    expirations = ticker.options
    print(f"  Available expirations ({len(expirations)} total):")
    for date in expirations:
        print(f"    {date}")
except Exception as e:
    print(f"  ERROR: {e}")

print()

# Test 7: Institutional holders — top institutions holding the stock
print("--- Institutional Holders ---")
try:
    holders = ticker.institutional_holders
    print(holders.to_string())
except Exception as e:
    print(f"  ERROR: {e}")
