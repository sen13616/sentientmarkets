'use client';

import { useRouter } from 'next/navigation';
import Nav from '../Nav';
import Footer from '../Footer';
import s from './indexpage.module.css';

/* Light upstream-unavailable state. This page has no local-scorer fallback
   and must never render the dark AssetPage. */
export default function IndexUnavailable() {
  const router = useRouter();
  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />
      <div className={s.wrap}>
        <div className={s.head}>
          <div>
            <div className={s.hName}>
              S&amp;P 500 <span className={s.tickerPill}>^GSPC</span>
            </div>
            <div className={s.hSector}>Breadth and dispersion across the scored universe</div>
          </div>
        </div>
        <div className={s.unavailable}>
          Sentiment service temporarily unavailable — breadth data will return on the next
          scoring tick. Try again in a few minutes.
        </div>
      </div>
      <Footer variant="light" />
    </div>
  );
}
