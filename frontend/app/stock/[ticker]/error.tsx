'use client';

import Link from 'next/link';

/* Light error state matching the new stock page. Note: ticker-not-found and
   sentiment-service-down both fall back to the dark AssetPage in page.tsx —
   this boundary only fires on unexpected render/runtime throws. */
export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div
      className="home-light"
      style={{
        background: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '80px 32px',
        textAlign: 'center',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a919e', fontWeight: 600 }}>
        Error
      </div>
      <div style={{ fontSize: 20, color: '#0a0b0d', fontWeight: 500, letterSpacing: '-0.01em' }}>
        Could not load sentiment data for this ticker.
      </div>
      <div style={{ fontSize: 13.5, color: '#5b616e', maxWidth: 420 }}>
        Something went wrong rendering this page. Try reloading, or come back shortly.
      </div>
      <Link
        href="/"
        style={{
          marginTop: 8,
          padding: '9px 20px',
          background: '#0052ff',
          borderRadius: 999,
          color: '#fff',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}
