'use client';

/**
 * The dark terminal example, extracted verbatim from the server page so the
 * curl line can carry the visitor's real demo key — copy-paste works out of
 * the box. Falls back to the sk-sm-your-key placeholder until a key is
 * ready (or when the demo-key flow is disabled).
 */

import { useDemoKey } from './DemoKeyProvider';
import { SENTIMENT_API_BASE } from '../../lib/api';

const FREE_RESPONSE = `{
  "ticker": "AAPL",
  "score": 72,
  "score_change_1d": 3.25,
  "score_change_1d_pct": 4.73,
  "label": "Bullish",
  "confidence": 81,
  "timestamp": "2026-04-24T14:32:00Z",
  "cache_age_seconds": 480,
  "market_hours": {
    "is_open": true,
    "next_open": "2026-04-27T14:30:00Z",
    "last_close": "2026-04-24T21:00:00Z"
  }
}`;

export default function LiveCurl() {
  const { apiKey, status } = useDemoKey();
  const key = status === 'ready' && apiKey ? apiKey : 'sk-sm-your-key';

  return (
    <div className="bg-[#0a0b0d] rounded-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-[#cf202f]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#05b169]/60" />
        <span className="ml-3 text-[10px] font-mono text-white/40">terminal</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-[11.5px] leading-[1.6] text-white/80 whitespace-pre">
{`$ curl -H "Authorization: Bearer ${key}" \\
    ${SENTIMENT_API_BASE}/v1/sentiment/AAPL
`}
          <span className="text-white/50">{FREE_RESPONSE.split('"score": 72')[0]}</span>
          <span className="text-[#4ade80] font-semibold">&quot;score&quot;: 72</span>
          <span className="text-white/50">{FREE_RESPONSE.split('"score": 72')[1]}</span>
        </pre>
      </div>
    </div>
  );
}
