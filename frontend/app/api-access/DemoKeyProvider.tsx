'use client';

/**
 * Owns the demo-key state machine for /api-access (APIACESSPAGE.md §5.2).
 *
 * One key per browser, reused across reloads (§1.1): the key lives in
 * localStorage and a fresh mint happens only when the browser holds none —
 * never just because the page loaded. DemoKeyCard and LiveCurl consume the
 * context; the page itself stays a server component with this provider
 * wrapped around its children.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { SENTIMENT_API_BASE } from '../../lib/api';

const KEY_STORAGE = 'sm_demo_key';
const EXPIRY_STORAGE = 'sm_demo_expiry';

export type DemoKeyStatus = 'idle' | 'loading' | 'ready' | 'capped' | 'error';

interface DemoKeyContextValue {
  apiKey: string | null;
  expiresAt: string | null;
  status: DemoKeyStatus;
  /** Secondary message shown alongside a usable key (e.g. mint cap hit). */
  note: string | null;
  busy: boolean;
  regenerate: () => void;
  retry: () => void;
}

const DemoKeyContext = createContext<DemoKeyContextValue>({
  apiKey: null,
  expiresAt: null,
  status: 'idle',
  note: null,
  busy: false,
  regenerate: () => {},
  retry: () => {},
});

export function useDemoKey() {
  return useContext(DemoKeyContext);
}

// localStorage access is SSR-guarded and best-effort (may throw on quota or
// privacy modes) — same idiom as HeroSearch's recent-searches store.
function readStored(): { key: string | null; expiry: string | null } {
  if (typeof window === 'undefined') return { key: null, expiry: null };
  try {
    return {
      key: window.localStorage.getItem(KEY_STORAGE),
      expiry: window.localStorage.getItem(EXPIRY_STORAGE),
    };
  } catch {
    return { key: null, expiry: null };
  }
}

function writeStored(key: string, expiry: string) {
  try {
    window.localStorage.setItem(KEY_STORAGE, key);
    window.localStorage.setItem(EXPIRY_STORAGE, expiry);
  } catch {
    /* best-effort */
  }
}

function clearStored() {
  try {
    window.localStorage.removeItem(KEY_STORAGE);
    window.localStorage.removeItem(EXPIRY_STORAGE);
  } catch {
    /* best-effort */
  }
}

function isUnexpired(expiry: string | null): boolean {
  if (!expiry) return false;
  const t = Date.parse(expiry);
  return Number.isFinite(t) && t > Date.now();
}

type MintResult =
  | { kind: 'ok'; apiKey: string; expiresAt: string }
  | { kind: 'capped' }
  | { kind: 'failed' };

async function postDemoKey(existingKey: string | null): Promise<MintResult> {
  try {
    const res = await fetch(`${SENTIMENT_API_BASE}/v1/demo-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ existing_key: existingKey }),
    });
    if (res.status === 429) return { kind: 'capped' };
    if (!res.ok) return { kind: 'failed' };
    const body = await res.json();
    if (typeof body?.api_key !== 'string' || typeof body?.expires_at !== 'string') {
      return { kind: 'failed' };
    }
    return { kind: 'ok', apiKey: body.api_key, expiresAt: body.expires_at };
  } catch {
    return { kind: 'failed' };
  }
}

// React 18 StrictMode double-mounts effects in dev; without this dedupe one
// page load would fire two existing_key:null POSTs and burn two mints
// against the per-IP cap. Module-level so it survives the throwaway mount.
let inflightMount: Promise<MintResult> | null = null;
function provisionOnce(existingKey: string | null): Promise<MintResult> {
  if (!inflightMount) {
    inflightMount = postDemoKey(existingKey).finally(() => {
      inflightMount = null;
    });
  }
  return inflightMount;
}

const CAPPED_MESSAGE =
  "You've created the maximum demo keys for now — reuse the one you have, or try again later.";

export default function DemoKeyProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<DemoKeyStatus>(enabled ? 'loading' : 'idle');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback(
    (result: MintResult, storedKey: string | null, storedExpiry: string | null) => {
      if (result.kind === 'ok') {
        writeStored(result.apiKey, result.expiresAt);
        setApiKey(result.apiKey);
        setExpiresAt(result.expiresAt);
        setStatus('ready');
        setNote(null);
        return;
      }
      // Mint failed — fall back to a stored, unexpired key if we have one.
      const haveStored = Boolean(storedKey) && isUnexpired(storedExpiry);
      if (haveStored) {
        setApiKey(storedKey);
        setExpiresAt(storedExpiry);
        setStatus('ready');
        setNote(result.kind === 'capped' ? CAPPED_MESSAGE : null);
      } else {
        setApiKey(null);
        setExpiresAt(null);
        setStatus(result.kind === 'capped' ? 'capped' : 'error');
        setNote(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    const { key, expiry } = readStored();
    // Show the stored key immediately; the POST refreshes its expiry (§3.1
    // returns the same key) or replaces it if the server rejects it.
    if (key && isUnexpired(expiry)) {
      setApiKey(key);
      setExpiresAt(expiry);
      setStatus('ready');
    }
    provisionOnce(key).then((r) => apply(r, key, expiry));
  }, [enabled, apply]);

  const regenerate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus('loading');
    setNote(null);
    const { key, expiry } = readStored();
    clearStored();
    setApiKey(null);
    setExpiresAt(null);
    const r = await postDemoKey(null);
    // Cap hit or outage: restore the old key rather than stranding the user.
    if (r.kind !== 'ok' && key && expiry && isUnexpired(expiry)) {
      writeStored(key, expiry);
    }
    apply(r, key, expiry);
    setBusy(false);
  }, [busy, apply]);

  // Single-shot manual retry from the error state — never an automatic loop.
  const retry = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus('loading');
    const { key, expiry } = readStored();
    const r = await postDemoKey(key);
    apply(r, key, expiry);
    setBusy(false);
  }, [busy, apply]);

  return (
    <DemoKeyContext.Provider
      value={{ apiKey, expiresAt, status, note, busy, regenerate, retry }}
    >
      {children}
    </DemoKeyContext.Provider>
  );
}
