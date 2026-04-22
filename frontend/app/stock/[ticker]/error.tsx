'use client';

import Link from 'next/link';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div style={{
      maxWidth: 1080, margin: '0 auto', padding: '80px 32px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      fontFamily: "'Geist Mono', monospace", textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.4px', color: '#4a5568' }}>
        Error
      </div>
      <div style={{ fontSize: 20, color: '#f0f4ff', fontFamily: "'Instrument Serif', serif" }}>
        Could not load sentiment data for this ticker.
      </div>
      <div style={{ fontSize: 12, color: '#4a5568', maxWidth: 400 }}>
        The ticker may be invalid, or the data service may be temporarily unavailable.
      </div>
      <Link
        href="/"
        style={{
          marginTop: 8, padding: '8px 20px', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, color: '#8c9ab5', textDecoration: 'none',
          fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", transition: 'color .15s',
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}
