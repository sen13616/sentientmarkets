'use client';

import styles from './loading.module.css';

/* Light error boundary for the breadth page — matches the page's canvas,
   never the dark theme. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className={`${styles.page} home-light`}>
      <div className={styles.wrap}>
        <div style={{ padding: '120px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0a0b0d', marginBottom: 8 }}>
            Something went wrong loading the S&amp;P 500 page
          </div>
          <div style={{ fontSize: 13.5, color: '#5b616e', marginBottom: 20 }}>
            Breadth data returns on the next scoring tick — this is usually transient.
          </div>
          <button
            type="button"
            onClick={reset}
            style={{
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
      </div>
    </div>
  );
}
