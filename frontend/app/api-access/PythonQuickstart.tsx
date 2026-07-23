'use client';

/**
 * Copy-paste Python quickstart — a complete stdlib-only script carrying the
 * visitor's live demo key (like the curl example), with an in-page Run
 * button. Run is a JS mirror: it performs the exact same three requests the
 * script makes, with the same key, and streams what the Python would print
 * line by line into the output terminal below. Free-tier response shape per
 * docs/SENTIMENTAPI_CONTRACT.md; unknown tickers come back as 200 +
 * `status`, which both the script and the mirror branch on.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDemoKey } from './DemoKeyProvider';
import { SENTIMENT_API_BASE } from '../../lib/api';

const WATCHLIST = ['AAPL', 'NVDA', 'TSLA'];

function buildCode(key: string): string {
  return `"""TheMarketMood SentimentAPI quickstart — run: python quickstart.py"""
import json
import ssl
import urllib.request

API_KEY = "${key}"  # provisioned for this browser on themarketmood.ai/api-access
BASE = "${SENTIMENT_API_BASE}"
WATCHLIST = [${WATCHLIST.map((t) => `"${t}"`).join(', ')}]

try:  # some Pythons (e.g. python.org macOS installs) ship without CA certs
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()

def get_sentiment(ticker):
    req = urllib.request.Request(
        f"{BASE}/v1/sentiment/{ticker}",
        headers={"Authorization": f"Bearer {API_KEY}"},
    )
    with urllib.request.urlopen(req, context=CTX) as resp:
        return json.load(resp)

print(f"{'TICKER':<8}{'SCORE':>6}  {'LABEL':<18}{'1D':>8}  {'CONF':>5}")
for t in WATCHLIST:
    try:
        d = get_sentiment(t)
    except Exception as e:
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            print("Your Python has no CA certificates — run: pip install certifi")
            break
        print(f"{t:<8}request failed: {e}")
        continue
    if "status" in d:  # ticker_not_found / insufficient_data — the API never guesses
        print(f"{t:<8}{d['message']}")
        continue
    chg = d["score_change_1d"]
    chg_s = f"{chg:+.2f}" if chg is not None else "n/a"
    print(f"{d['ticker']:<8}{d['score']:>6.0f}  {d['label']:<18}{chg_s:>8}  {d['confidence']:>4}%")
`;
}

type Tone = 'prompt' | 'plain' | 'bullish' | 'bearish' | 'error';
type Line = { text: string; tone: Tone };

const TONE_CLASS: Record<Tone, string> = {
  prompt: 'text-[#7c828a]',
  plain: 'text-[#5b616e]',
  bullish: 'text-[#05b169]',
  bearish: 'text-[#cf202f]',
  error: 'text-[#b45309]',
};

const HEADER =
  'TICKER'.padEnd(8) + 'SCORE'.padStart(6) + '  ' + 'LABEL'.padEnd(18) + '1D'.padStart(8) + '  ' + 'CONF'.padStart(5);

/* Static example shown before the first run — values consistent with the
   page's example response (AAPL 72 / Bullish / +3.25 / 81%). */
const EXAMPLE_LINES: Line[] = [
  { text: '# example output — press Run for live data', tone: 'prompt' },
  { text: '$ python quickstart.py', tone: 'prompt' },
  { text: HEADER, tone: 'plain' },
  { text: 'AAPL        72  Bullish              +3.25    81%', tone: 'bullish' },
  { text: 'NVDA        84  Strongly Bullish     +1.10    77%', tone: 'bullish' },
  { text: 'TSLA        41  Bearish              -2.40    64%', tone: 'bearish' },
];

/* Formatting parity with the script's final print — same paddings as the
   Python f-string, so Run output matches a real terminal run exactly. */
function formatRow(d: {
  ticker: string;
  score: number;
  label: string;
  score_change_1d: number | null;
  confidence: number;
}): Line {
  const chg = d.score_change_1d;
  const chgS = chg == null ? 'n/a' : (chg >= 0 ? '+' : '') + chg.toFixed(2);
  const text =
    d.ticker.padEnd(8) +
    String(Math.round(d.score)).padStart(6) +
    '  ' +
    d.label.padEnd(18) +
    chgS.padStart(8) +
    '  ' +
    (String(d.confidence).padStart(4) + '%');
  const tone: Tone = d.label.includes('Bullish')
    ? 'bullish'
    : d.label.includes('Bearish')
      ? 'bearish'
      : 'plain';
  return { text, tone };
}

/* Minimal line-based tint — no highlight library. Copy always uses the raw
   string from buildCode, never this rendering. */
const TOKEN_RE =
  /("(?:[^"\\]|\\.)*"|#.*$|\b(?:import|def|for|if|with|continue|return|in|not|is|None|else|try|except|break)\b)/g;
const KEYWORDS = new Set([
  'import', 'def', 'for', 'if', 'with', 'continue', 'return', 'in', 'not', 'is', 'None', 'else',
  'try', 'except', 'break',
]);

function renderLine(line: string, i: number): ReactNode {
  if (line.startsWith('"""')) {
    return (
      <span key={i}>
        <span className="text-[#7c828a]">{line}</span>
        {'\n'}
      </span>
    );
  }
  return (
    <span key={i}>
      {line.split(TOKEN_RE).map((part, j) => {
        if (!part) return null;
        if (part.startsWith('#')) return <span key={j} className="text-[#7c828a]">{part}</span>;
        if (part.startsWith('"')) return <span key={j} className="text-[#05b169]">{part}</span>;
        if (KEYWORDS.has(part)) {
          return <span key={j} className="text-[#0052ff]">{part}</span>;
        }
        return <span key={j}>{part}</span>;
      })}
      {'\n'}
    </span>
  );
}

export default function PythonQuickstart() {
  const { apiKey, status } = useDemoKey();
  const [copied, setCopied] = useState(false);
  const [lines, setLines] = useState<Line[]>(EXAMPLE_LINES);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  // Follow the stream: keep the newest output line in view as rows arrive.
  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const keyReady = status === 'ready' && Boolean(apiKey);
  const key = keyReady ? (apiKey as string) : 'sk-sm-your-key';
  const code = buildCode(key);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the code is selectable text anyway */
    }
  };

  const run = async () => {
    if (running || !keyReady) return;
    setRunning(true);
    setHasRun(true);
    // No-op when the panel is already on screen; rescues the case where the
    // card bottom sits below the fold when Run is clicked.
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setLines([
      { text: '$ python quickstart.py', tone: 'prompt' },
      { text: HEADER, tone: 'plain' },
    ]);
    const push = (line: Line) => setLines((prev) => [...prev, line]);
    // Sequential on purpose — same order and pacing as the Python loop.
    for (const t of WATCHLIST) {
      try {
        const res = await fetch(`${SENTIMENT_API_BASE}/v1/sentiment/${t}`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) {
          // urllib raises HTTPError; the script prints it via the except branch.
          push({ text: `${t.padEnd(8)}request failed: HTTP Error ${res.status}`, tone: 'error' });
          continue;
        }
        const d = await res.json();
        if ('status' in d) {
          push({ text: `${t.padEnd(8)}${d.message}`, tone: 'error' });
          continue;
        }
        push(formatRow(d));
      } catch {
        push({ text: `${t.padEnd(8)}request failed: network error`, tone: 'error' });
      }
    }
    setRunning(false);
  };

  return (
    <div>
      {/* IDE-style card: editor pane with its own scroll, output panel
          docked at the bottom — Run and its result share the screen. */}
      <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden min-w-0">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f7f7f7] border-b border-[#dee1e6]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#cf202f]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#05b169]/60" />
          <span className="ml-3 text-[10px] font-mono text-[#7c828a]">quickstart.py</span>
          <span className="ml-auto flex items-center gap-2">
            <button
              onClick={run}
              disabled={running || !keyReady}
              className="bg-[#05b169] hover:bg-[#049a5c] text-white px-3 py-1 rounded-md text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {running ? 'Running…' : 'Run ▸'}
            </button>
            <button
              onClick={copy}
              className="bg-[#0052ff] hover:bg-[#003ecc] text-white px-3 py-1 rounded-md text-[11px] font-semibold transition-all active:scale-95"
            >
              {copied ? 'Copied' : 'Copy file'}
            </button>
          </span>
        </div>

        <div className="p-4 overflow-auto max-h-[400px]">
          <pre className="font-mono text-[11.5px] leading-[1.6] text-[#0a0b0d] whitespace-pre">
            {code.split('\n').map(renderLine)}
          </pre>
        </div>

        <div ref={panelRef} className="border-t border-[#dee1e6] bg-[#f7f7f7]">
          <div className="px-4 py-2 text-[10px] font-mono text-[#7c828a] uppercase tracking-[0.08em]">
            output
          </div>
          <div ref={outRef} className="px-4 pb-4 overflow-y-auto overflow-x-auto max-h-[220px]">
            <pre
              className={`font-mono text-[11.5px] leading-[1.6] whitespace-pre ${hasRun ? '' : 'opacity-60'}`}
            >
              {lines.map((l, i) => (
                <span key={i} className={TONE_CLASS[l.tone]}>
                  {l.text}
                  {'\n'}
                </span>
              ))}
              {running && <span className="text-[#5b616e] animate-pulse">▊</span>}
            </pre>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#5b616e] leading-relaxed mt-4">
        Run fires the same three requests the script makes — the free key allows 10 per minute.
        Scores are live data from the last completed scoring pass.
      </p>
    </div>
  );
}
