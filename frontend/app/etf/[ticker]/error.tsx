'use client';

/* Dark error boundary matching the AssetPage canvas. The page component
   rethrows non-404 backend failures — without this Next shows its raw
   error screen. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        background: '#0A0A0B',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '80px 32px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', fontWeight: 600 }}>
        Error
      </div>
      <div style={{ fontSize: 20, color: '#fafafa', fontWeight: 500, letterSpacing: '-0.01em' }}>
        Could not load data for this asset.
      </div>
      <div style={{ fontSize: 13.5, color: '#a1a1aa', maxWidth: 420 }}>
        Something went wrong fetching sentiment data. This is usually transient — try again.
      </div>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 8,
          background: '#0052ff',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '10px 22px',
          fontSize: 13.5,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Try again
      </button>
    </div>
  );
}
