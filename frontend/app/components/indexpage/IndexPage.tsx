'use client';

import { useRouter } from 'next/navigation';
import Nav from '../Nav';
import Footer from '../Footer';
import Reveal from '../Reveal';
import IndexHeader from './IndexHeader';
import BreadthStrip from './BreadthStrip';
import DistributionCard from './DistributionCard';
import SectorCard from './SectorCard';
import MoversCard from './MoversCard';
import ConstituentsCard from './ConstituentsCard';
import { Sp500Payload } from './types';
import s from './indexpage.module.css';

/* S&P 500 breadth page. There is deliberately NO index-level sentiment
   score anywhere on this page — the index is described by the distribution
   of its constituents. Uses the same `home-light` marker mechanism as the
   stock page for the light canvas. */
export default function IndexPage({ data }: { data: Sp500Payload }) {
  const router = useRouter();
  const hasMovers = data.movers.top.length > 0 || data.movers.bottom.length > 0;

  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />

      <div className={s.wrap}>
        <IndexHeader data={data} />

        <Reveal>
          <DistributionCard data={data} />
        </Reveal>

        <Reveal>
          <BreadthStrip data={data} />
        </Reveal>

        <Reveal>
          <SectorCard data={data} />
        </Reveal>

        {hasMovers && (
          <div className={s.twoCol}>
            {data.movers.top.length > 0 && (
              <Reveal>
                <MoversCard
                  title="Biggest gainers"
                  sub="Largest 1-day composite increases."
                  movers={data.movers.top}
                />
              </Reveal>
            )}
            {data.movers.bottom.length > 0 && (
              <Reveal delay={0.1}>
                <MoversCard
                  title="Biggest decliners"
                  sub="Largest 1-day composite decreases."
                  movers={data.movers.bottom}
                />
              </Reveal>
            )}
          </div>
        )}

        <Reveal>
          <ConstituentsCard
            constituents={data.constituents}
            universeScored={data.universe_scored}
            movers={data.movers}
          />
        </Reveal>

        <div className={s.pageFoot}>
          Breadth and dispersion are computed across the scored universe on a fixed cadence. No
          index-level sentiment score is published — the index is described by the distribution
          of its constituents, not by their average. Sentiment is not investment advice.
        </div>
      </div>

      <Footer variant="light" />
    </div>
  );
}
