import styles from './loading.module.css';

/* Light skeleton mirroring the breadth-page layout (header → distribution
   card → strip → sector card). */
export default function Loading() {
  return (
    <div className={`${styles.page} home-light`}>
      <div className={styles.wrap}>
        {/* Header */}
        <div className={styles.head}>
          <div>
            <div className={styles.skeleton} style={{ width: 180, height: 20, marginBottom: 10 }} />
            <div className={styles.skeleton} style={{ width: 240, height: 13, marginBottom: 14 }} />
            <div className={styles.skeleton} style={{ width: 220, height: 24, marginBottom: 14 }} />
            <div className={styles.row}>
              <div className={styles.skeleton} style={{ width: 190, height: 25, borderRadius: 999 }} />
              <div className={styles.skeleton} style={{ width: 200, height: 25, borderRadius: 999 }} />
            </div>
          </div>
          <div>
            <div className={styles.skeleton} style={{ width: 150, height: 10, marginBottom: 8, marginLeft: 'auto' }} />
            <div className={styles.skeleton} style={{ width: 140, height: 46, marginBottom: 12, marginLeft: 'auto' }} />
            <div className={styles.skeleton} style={{ width: 190, height: 22, marginLeft: 'auto' }} />
          </div>
        </div>

        {/* Distribution card */}
        <div className={styles.card}>
          <div className={styles.skeleton} style={{ width: 130, height: 15, marginBottom: 8 }} />
          <div className={styles.skeleton} style={{ width: 460, height: 12, marginBottom: 16, maxWidth: '100%' }} />
          <div className={styles.skeleton} style={{ width: '100%', height: 190 }} />
        </div>

        {/* Strip */}
        <div className={styles.strip}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.cell}>
              <div className={styles.skeleton} style={{ width: 90, height: 10, marginBottom: 9 }} />
              <div className={styles.skeleton} style={{ width: 60, height: 20 }} />
            </div>
          ))}
        </div>

        {/* Sector card */}
        <div className={styles.card}>
          <div className={styles.skeleton} style={{ width: 130, height: 15, marginBottom: 8 }} />
          <div className={styles.skeleton} style={{ width: 420, height: 12, marginBottom: 16, maxWidth: '100%' }} />
          <div className={styles.skeleton} style={{ width: '100%', height: 320 }} />
        </div>
      </div>
    </div>
  );
}
