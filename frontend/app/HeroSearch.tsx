'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSentiment, getHomeData } from '@/lib/api';
import styles from './page.module.css';

interface SearchResult {
  ticker: string;
  display_ticker?: string;
  name: string;
  type?: string;
  asset_type?: string;
  exchange?: string;
}

interface SentimentPreview {
  market_mood_score: number;
  market_mood_label: string;
}

interface TrendingItem {
  rank: number;
  ticker: string;
  name: string;
  mention_change_percent: number;
  momentum_signal: string;
  market_mood_score: number;
  market_mood_label: string;
}

type FocusableRow =
  | { kind: 'result';     data: SearchResult }
  | { kind: 'recent';     data: SearchResult }
  | { kind: 'trending';   data: TrendingItem };

interface HeroSearchProps {
  onFocusModeChange?: (focused: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const RECENT_KEY = 'sm_recent_searches';
const MAX_RECENT = 5;
const HOVER_DELAY_MS = 200;
const SEARCH_DEBOUNCE_MS = 300;
const RESULT_LIMIT = 6;
const TRENDING_DISPLAY_LIMIT = 3;
const RECENT_DISPLAY_LIMIT = 3;

function getAssetUrl(r: SearchResult): string {
  return `/${r.asset_type || 'stock'}/${encodeURIComponent(r.ticker)}`;
}

export function moodColor(label: string | undefined | null): string {
  const l = (label || '').toLowerCase();
  if (l.includes('bull')) return 'var(--green)';
  if (l.includes('bear')) return 'var(--red)';
  return 'var(--tx2)';
}

interface EmptyDropdownSections {
  trending: TrendingItem[];
  recent: SearchResult[];
}

function buildEmptyDropdownSections(
  trending: TrendingItem[] | null,
  recent: SearchResult[],
): EmptyDropdownSections {
  const t = (trending ?? []).slice(0, TRENDING_DISPLAY_LIMIT);
  const tSet = new Set(t.map(x => x.ticker.toUpperCase()));
  const r = recent
    .filter(x => !tSet.has(x.ticker.toUpperCase()))
    .slice(0, RECENT_DISPLAY_LIMIT);
  return { trending: t, recent: r };
}

function readRecent(): SearchResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.matchMark}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function HeroSearch({ onFocusModeChange }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [previewTicker, setPreviewTicker] = useState<string | null>(null);
  const [preview, setPreview] = useState<SentimentPreview | null>(null);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[] | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const previewCache = useRef<Map<string, SentimentPreview>>(new Map());
  const fetchSeqRef = useRef(0);
  const trendingFetchedRef = useRef<boolean>(false);

  // Notify parent on focus-mode change (after commit).
  useEffect(() => {
    onFocusModeChange?.(focused);
  }, [focused, onFocusModeChange]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  // One-shot trending fetch, kicked off on first focus. Claim the slot
  // before awaiting so a rapid re-focus can't fire a second request.
  useEffect(() => {
    if (!focused) return;
    if (trendingFetchedRef.current) return;
    trendingFetchedRef.current = true;
    (async () => {
      try {
        const home = await getHomeData();
        const top: any[] = (home?.trending_tickers ?? []).slice(0, TRENDING_DISPLAY_LIMIT);
        if (top.length === 0) return;
        const sentiments = await Promise.all(
          top.map(t => getSentiment(t.ticker).catch(() => null))
        );
        if (sentiments.some(s => !s)) {
          console.warn('[HeroSearch] Trending omitted — partial sentiment failure');
          return;
        }
        const merged: TrendingItem[] = top.map((t, i) => ({
          rank: t.rank,
          ticker: t.ticker,
          name: t.name,
          mention_change_percent: t.mention_change_percent,
          momentum_signal: t.momentum_signal,
          market_mood_score: sentiments[i]!.market_mood_score,
          market_mood_label: sentiments[i]!.market_mood_label,
        }));
        setTrendingItems(merged);
      } catch (err) {
        console.warn('[HeroSearch] Trending fetch failed:', err);
      }
    })();
  }, [focused]);

  // Outside-click → exit focus mode
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
        setFocusIdx(-1);
        setPreviewTicker(null);
        setPreview(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced /api/search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const seq = ++fetchSeqRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
        if (seq !== fetchSeqRef.current) return;
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setFocusIdx(-1);
        }
      } catch {
        // ignore
      } finally {
        if (seq === fetchSeqRef.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Clear preview when the user types — last hovered ticker shouldn't linger.
  useEffect(() => {
    setPreviewTicker(null);
    setPreview(null);
  }, [query]);

  // Hover/keyboard preview resolution: trending cache → previewCache → network.
  useEffect(() => {
    clearTimeout(hoverTimerRef.current);
    if (!previewTicker) {
      setPreview(null);
      return;
    }
    // Trending cache hit → instant + mirror to previewCache for forward consistency.
    const trendingHit = trendingItems?.find(
      t => t.ticker.toUpperCase() === previewTicker.toUpperCase()
    );
    if (trendingHit) {
      const entry: SentimentPreview = {
        market_mood_score: trendingHit.market_mood_score,
        market_mood_label: trendingHit.market_mood_label,
      };
      previewCache.current.set(trendingHit.ticker, entry);
      setPreview(entry);
      return;
    }
    // previewCache hit → instant.
    const cached = previewCache.current.get(previewTicker);
    if (cached) {
      setPreview(cached);
      return;
    }
    // Network fetch with 200ms hover debounce.
    setPreview(null);
    const target = previewTicker;
    hoverTimerRef.current = setTimeout(async () => {
      try {
        const data = await getSentiment(target);
        if (data?.market_mood_score == null || !data?.market_mood_label) return;
        const entry: SentimentPreview = {
          market_mood_score: data.market_mood_score,
          market_mood_label: data.market_mood_label,
        };
        previewCache.current.set(target, entry);
        setPreviewTicker(curr => {
          if (curr === target) setPreview(entry);
          return curr;
        });
      } catch {
        // preview is optional — swallow and keep dropdown usable
      }
    }, HOVER_DELAY_MS);
    return () => clearTimeout(hoverTimerRef.current);
  }, [previewTicker, trendingItems]);

  const recordRecent = useCallback((r: SearchResult) => {
    const entry: SearchResult = { ticker: r.ticker, name: r.name, asset_type: r.asset_type };
    setRecent(curr => {
      const next = [entry, ...curr.filter(x => x.ticker !== entry.ticker)].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // localStorage may throw on quota — write is best-effort
      }
      return next;
    });
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocused(false);
    setFocusIdx(-1);
    setPreviewTicker(null);
    setPreview(null);
  }, []);

  const navigate = useCallback((r: SearchResult) => {
    recordRecent(r);
    exitFocusMode();
    setQuery('');
    setResults([]);
    router.push(getAssetUrl(r));
  }, [recordRecent, exitFocusMode, router]);

  const navigateToTicker = useCallback(async (input: string) => {
    const ticker = input.trim().toUpperCase();
    if (!ticker) return;
    exitFocusMode();
    setQuery('');
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(ticker)}`);
      const data = await res.json();
      const exact = data.results?.find(
        (x: SearchResult) =>
          x.ticker.toUpperCase() === ticker || (x.display_ticker ?? '').toUpperCase() === ticker
      );
      if (exact) {
        recordRecent(exact);
        router.push(getAssetUrl(exact));
      } else if (data.results?.length > 0) {
        const first: SearchResult = data.results[0];
        recordRecent(first);
        router.push(getAssetUrl(first));
      } else {
        router.push(`/stock/${ticker}`);
      }
    } catch {
      router.push(`/stock/${ticker}`);
    }
  }, [exitFocusMode, recordRecent, router]);

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0;
  const visibleResults = results.slice(0, RESULT_LIMIT);
  const noResults = showResults && !loading && results.length === 0;

  // Build the empty-state sections (deduped) once per render. Used for both
  // rendering and keyboard nav so indices stay aligned.
  const sections: EmptyDropdownSections = !showResults
    ? buildEmptyDropdownSections(trendingItems, recent)
    : { trending: [], recent: [] };

  const keyRows: FocusableRow[] = showResults
    ? visibleResults.map<FocusableRow>(r => ({ kind: 'result', data: r }))
    : [
        ...sections.trending.map<FocusableRow>(t => ({ kind: 'trending', data: t })),
        ...sections.recent.map<FocusableRow>(r => ({ kind: 'recent',   data: r })),
      ];

  const activate = useCallback((row: FocusableRow) => {
    if (row.kind === 'trending') {
      // asset_type unknown for trending — let navigateToTicker resolve via
      // /api/search; it also writes the resolved entry to recents.
      navigateToTicker(row.data.ticker);
    } else {
      navigate(row.data);
    }
  }, [navigate, navigateToTicker]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      exitFocusMode();
      inputRef.current?.blur();
      return;
    }
    if (keyRows.length === 0) {
      if (e.key === 'Enter' && trimmedQuery) navigateToTicker(trimmedQuery);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(focusIdx + 1, keyRows.length - 1);
      setFocusIdx(next);
      const r = keyRows[next];
      if (r) setPreviewTicker(r.data.ticker);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(focusIdx - 1, -1);
      setFocusIdx(next);
      setPreviewTicker(next >= 0 && keyRows[next] ? keyRows[next].data.ticker : null);
    } else if (e.key === 'Enter') {
      if (focusIdx >= 0 && keyRows[focusIdx]) activate(keyRows[focusIdx]);
      else if (trimmedQuery) navigateToTicker(trimmedQuery);
    }
  }

  function handleGo() {
    if (focusIdx >= 0 && keyRows[focusIdx]) activate(keyRows[focusIdx]);
    else if (trimmedQuery) navigateToTicker(trimmedQuery);
  }

  function handleRowEnter(ticker: string, kbIndex: number) {
    setFocusIdx(kbIndex);
    setPreviewTicker(ticker);
  }
  function handleRowLeave() {
    setPreviewTicker(null);
    setPreview(null);
  }

  const showPreview = focused && !!previewTicker && !!preview;
  const moodC = preview ? moodColor(preview.market_mood_label) : 'var(--tx2)';
  const scoreSign = preview && preview.market_mood_score >= 50 ? '+' : '';

  function renderSearchRow(r: SearchResult, listIndex: number, kbBase: number) {
    const i = kbBase + listIndex;
    const highlightQ = showResults ? trimmedQuery : '';
    return (
      <div
        key={`${r.asset_type ?? 'x'}-${r.ticker}-${i}`}
        className={`${styles.dropdownItem}${i === focusIdx ? ' ' + styles.dropdownFocused : ''}`}
        onMouseDown={(e) => { e.preventDefault(); navigate(r); }}
        onMouseEnter={() => handleRowEnter(r.ticker, i)}
        onMouseLeave={handleRowLeave}
      >
        <div className={styles.diLeft}>
          <span className={styles.diTicker}>
            <HighlightedText text={r.display_ticker || r.ticker} query={highlightQ} />
          </span>
          <span className={styles.diName}>
            <HighlightedText text={r.name} query={highlightQ} />
          </span>
        </div>
        {r.type && (
          <div className={styles.diRight}>
            <span className={`${styles.tag} ${styles.tBlue}`}>{r.type}</span>
          </div>
        )}
      </div>
    );
  }

  function renderTrendingRow(t: TrendingItem, listIndex: number, kbBase: number) {
    const i = kbBase + listIndex;
    const tMoodC = moodColor(t.market_mood_label);
    const tScoreSign = t.market_mood_score >= 50 ? '+' : '';
    const pct = t.mention_change_percent;
    const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '';
    const pctColor = pct > 0 ? 'var(--green)' : pct < 0 ? 'var(--red)' : 'var(--tx2)';
    return (
      <div
        key={`trending-${t.ticker}-${i}`}
        className={`${styles.dropdownItem} ${styles.dropdownItemTrending}${i === focusIdx ? ' ' + styles.dropdownFocused : ''}`}
        onMouseDown={(e) => { e.preventDefault(); activate({ kind: 'trending', data: t }); }}
        onMouseEnter={() => handleRowEnter(t.ticker, i)}
        onMouseLeave={handleRowLeave}
      >
        <div className={styles.diLeft}>
          <span className={styles.diRank}>{t.rank}</span>
          <span className={styles.diTicker}>{t.ticker}</span>
          <span className={styles.diName}>{t.name}</span>
        </div>
        <div className={styles.diRight}>
          <span className={styles.diMood} style={{ color: tMoodC }}>
            {t.market_mood_label}
          </span>
          <span className={styles.diScore} style={{ color: tMoodC }}>
            {tScoreSign}{Math.round(t.market_mood_score)}
          </span>
          <span className={styles.diMention} style={{ color: pctColor }}>
            {arrow ? `${arrow} ` : ''}{Math.abs(pct).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`${styles.vignette}${focused ? ' ' + styles.vignetteVisible : ''}`}
        aria-hidden="true"
      />
      <div className={styles.searchOuter} ref={wrapRef}>
        <div className={styles.searchBar}>
          <div
            className={`${styles.searchBarContent}${showPreview ? ' ' + styles.searchBarContentHidden : ''}`}
          >
            <div className={styles.searchIconWrap} aria-hidden="true">
              <svg
                width="15" height="15" viewBox="0 0 15 15" fill="none"
                style={{ opacity: loading ? 0 : 0.25, transition: 'opacity 0.2s ease' }}
              >
                <circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="1.3" />
                <path d="M11 11L13.5 13.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <svg
                className={styles.loadingSpinner}
                width="15" height="15" viewBox="0 0 15 15" fill="none"
                style={{ opacity: loading ? 1 : 0, transition: 'opacity 0.2s ease' }}
              >
                <circle
                  cx="7.5" cy="7.5" r="5.5"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                  strokeDasharray="20 100"
                />
              </svg>
            </div>
            <input
              ref={inputRef}
              className={styles.searchInput}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              placeholder="Search ticker or company — AAPL, Tesla, NVDA…"
              autoComplete="off"
            />
            <button className={styles.searchGo} onClick={handleGo}>
              Read mood →
            </button>
          </div>

          <div
            className={`${styles.previewOverlay}${showPreview ? ' ' + styles.previewVisible : ''}`}
            aria-hidden={!showPreview}
          >
            {preview && previewTicker && (
              <>
                <span className={styles.previewTicker}>{previewTicker}</span>
                <span className={styles.previewDivider} />
                <span className={styles.previewMood} style={{ color: moodC }}>
                  {preview.market_mood_label}
                </span>
                <span className={styles.previewScore} style={{ color: moodC }}>
                  {scoreSign}{Math.round(preview.market_mood_score)}
                </span>
                <span className={styles.previewHint}>Click to open →</span>
              </>
            )}
          </div>
        </div>

        {focused && showResults && !noResults && visibleResults.length > 0 && (
          <div className={styles.searchDropdown}>
            {visibleResults.map((r, idx) => renderSearchRow(r, idx, 0))}
          </div>
        )}

        {focused && noResults && (
          <div className={styles.searchDropdown}>
            <div className={styles.dropdownEmpty}>
              <div className={styles.dropdownEmptyIcon}>—</div>
              <div className={styles.dropdownEmptyLine}>
                No matches for &ldquo;{trimmedQuery}&rdquo;
              </div>
              <div className={styles.dropdownEmptySubline}>
                Try a ticker or company name
              </div>
            </div>
          </div>
        )}

        {focused && !showResults && (
          <div className={styles.searchDropdown}>
            {sections.trending.length > 0 && (
              <div className={`${styles.dropdownSection} ${styles.dropdownSectionTrending}`}>
                <div className={styles.dropdownSectionHeader}>Trending</div>
                {sections.trending.map((t, idx) => renderTrendingRow(t, idx, 0))}
              </div>
            )}
            {sections.recent.length > 0 && (
              <div className={styles.dropdownSection}>
                <div className={styles.dropdownSectionHeader}>Recent</div>
                {sections.recent.map((r, idx) =>
                  renderSearchRow(r, idx, sections.trending.length)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
