import styles from './loading.module.css';

/* Light skeleton mirroring the new sentiment page layout (header → context
   strip → history card → drivers card → two-col). Non-universe tickers
   briefly see this before the dark AssetPage fallback — accepted tradeoff. */
export default function Loading() {
  return (
    <div className={`${styles.page} home-light`}>
      <div className={styles.wrap}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.skeleton} style={{ width: 220, height: 13, marginBottom: 18 }} />
          <div className={styles.headRow}>
            <div>
              <div className={styles.skeleton} style={{ width: 260, height: 28, marginBottom: 10 }} />
              <div className={styles.skeleton} style={{ width: 320, height: 15, marginBottom: 14 }} />
              <div className={styles.row}>
                <div className={styles.skeleton} style={{ width: 150, height: 26, borderRadius: 999 }} />
                <div className={styles.skeleton} style={{ width: 130, height: 26, borderRadius: 999 }} />
              </div>
            </div>
            <div>
              <div className={styles.skeleton} style={{ width: 180, height: 52, marginBottom: 12 }} />
              <div className={styles.skeleton} style={{ width: 220, height: 24 }} />
            </div>
          </div>
        </div>

        {/* Context strip */}
        <div className={styles.strip}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.cell}>
              <div className={styles.skeleton} style={{ width: 110, height: 11, marginBottom: 10 }} />
              <div className={styles.skeleton} style={{ width: 70, height: 22 }} />
            </div>
          ))}
        </div>

        {/* History + drivers cards */}
        <div className={styles.card}>
          <div className={styles.skeleton} style={{ width: 140, height: 15, marginBottom: 16 }} />
          <div className={styles.skeleton} style={{ height: 260 }} />
        </div>
        <div className={styles.card}>
          <div className={styles.skeleton} style={{ width: 160, height: 15, marginBottom: 16 }} />
          <div className={styles.skeleton} style={{ height: 230 }} />
        </div>

        {/* Two-col */}
        <div className={styles.twoCol}>
          {[0, 1].map((i) => (
            <div key={i} className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.skeleton} style={{ width: 150, height: 15, marginBottom: 16 }} />
              <div className={styles.skeleton} style={{ height: 170 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
