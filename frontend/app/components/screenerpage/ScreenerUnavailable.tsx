'use client';

import { useRouter } from 'next/navigation';
import Nav from '../Nav';
import Footer from '../Footer';
import s from './screenerpage.module.css';

/* Light unavailable state — "building" right after a deploy (first sweep
   still running) vs a generic upstream outage. Never the dark theme. */
export default function ScreenerUnavailable({ building }: { building: boolean }) {
  const router = useRouter();
  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />
      <div className={s.wrap}>
        <div className={s.head}>
          <div>
            <div className={s.hTitle}>Screener</div>
            <div className={s.hSub}>
              Filter the universe by sentiment structure — where the channels agree, and where
              they don&apos;t.
            </div>
          </div>
        </div>
        <div className={s.unavailable}>
          {building
            ? 'First universe scan is in progress — the screener fills in within a few minutes of deploy.'
            : 'Screener data is temporarily unavailable — it returns on the next scoring tick.'}
        </div>
      </div>
      <Footer variant="light" />
    </div>
  );
}
