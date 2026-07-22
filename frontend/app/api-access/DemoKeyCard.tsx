'use client';

/**
 * The "Your free key" hero card — displays the browser's demo key (a sandbox
 * credential, deliberately safe to show), its rolling expiry, and the
 * Regenerate control. Replaces the old "get notified" mailto CTA when the
 * page is live.
 */

import { useState } from 'react';
import { useDemoKey } from './DemoKeyProvider';

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DemoKeyCard() {
  const { apiKey, expiresAt, status, note, busy, regenerate, retry } = useDemoKey();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the key is selectable text anyway */
    }
  };

  const expiry = formatExpiry(expiresAt);

  return (
    <div className="bg-white border border-[#dee1e6] rounded-xl p-5 max-w-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7c828a]">
          Your free key
        </span>
        {status === 'ready' && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#05b169]">
            Active
          </span>
        )}
      </div>

      {status === 'loading' && (
        <div className="font-mono text-[13px] text-[#7c828a] bg-[#f7f7f7] border border-[#eef0f3] rounded-lg px-3 py-2.5">
          Provisioning your key…
        </div>
      )}

      {status === 'ready' && apiKey && (
        <>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[13px] text-[#0a0b0d] bg-[#f7f7f7] border border-[#eef0f3] rounded-lg px-3 py-2.5 overflow-x-auto whitespace-nowrap">
              {apiKey}
            </code>
            <button
              onClick={copy}
              className="shrink-0 bg-[#0052ff] hover:bg-[#003ecc] text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-[#5b616e] leading-relaxed mt-3">
            Provisioned to this browser — no signup needed.
            {expiry && (
              <>
                {' '}Valid through <strong className="text-[#0a0b0d]">{expiry}</strong>, and every
                request you make renews it to a full 7 days.
              </>
            )}
          </p>
          {note && <p className="text-xs text-[#f5a623] leading-relaxed mt-2">{note}</p>}
          <button
            onClick={regenerate}
            disabled={busy}
            className="mt-3 text-xs font-semibold text-[#7c828a] hover:text-[#0a0b0d] transition-colors disabled:opacity-50"
          >
            Regenerate key
          </button>
        </>
      )}

      {status === 'capped' && (
        <p className="text-xs text-[#5b616e] leading-relaxed">
          You&apos;ve created the maximum demo keys for now — reuse the one you have, or try again
          later.
        </p>
      )}

      {status === 'error' && (
        <>
          <p className="text-xs text-[#5b616e] leading-relaxed">
            Key provisioning is unavailable right now — try again in a minute.
          </p>
          <button
            onClick={retry}
            disabled={busy}
            className="mt-3 bg-[#0052ff] hover:bg-[#003ecc] text-white px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
