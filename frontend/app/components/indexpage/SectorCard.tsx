import SectorChart from './charts/SectorChart';
import { Sp500Payload } from './types';
import s from './indexpage.module.css';

export default function SectorCard({ data }: { data: Sp500Payload }) {
  if (data.sectors.every((r) => r.average_score === null)) return null;
  return (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Sector breakdown</h3>
      <p className={s.cardSub}>
        Mean composite per sector, measured from neutral. The dashed line is the universe mean —
        sectors to its right are running hotter than the market as a whole.
      </p>
      <SectorChart sectors={data.sectors} mean={data.stats.mean} />
    </div>
  );
}
