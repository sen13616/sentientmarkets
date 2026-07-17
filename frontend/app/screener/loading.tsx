import styles from './loading.module.css';

/* Light skeleton mirroring the screener layout (head → presets → rail + table). */
export default function Loading() {
  return (
    <div className={`${styles.page} home-light`}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <div>
            <div className={styles.skeleton} style={{ width: 120, height: 22, marginBottom: 8 }} />
            <div className={styles.skeleton} style={{ width: 380, height: 13, maxWidth: '100%' }} />
          </div>
          <div className={styles.skeleton} style={{ width: 120, height: 40 }} />
        </div>

        <div className={styles.row}>
          {[92, 150, 148, 140, 110, 130, 120].map((w, i) => (
            <div key={i} className={styles.skeleton} style={{ width: w, height: 30, borderRadius: 999 }} />
          ))}
        </div>

        <div className={styles.cols}>
          <div className={styles.rail}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeleton} style={{ width: '100%', height: 26, marginBottom: 18 }} />
            ))}
          </div>
          <div className={styles.tbl}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ width: '100%', height: 32, marginBottom: 12 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
