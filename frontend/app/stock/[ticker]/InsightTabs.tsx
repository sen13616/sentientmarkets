'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface InsightTabsProps {
  summary: string | null;
  bullCase: string | null;
  bearCase: string | null;
  whatToWatch: string | null;
}

const TABS = [
  { key: 'summary',    label: 'Summary' },
  { key: 'bull',       label: 'Bull case' },
  { key: 'bear',       label: 'Bear case' },
  { key: 'watch',      label: 'What to watch' },
] as const;

export default function InsightTabs({ summary, bullCase, bearCase, whatToWatch }: InsightTabsProps) {
  const [active, setActive] = useState<'summary' | 'bull' | 'bear' | 'watch'>('summary');

  const content: Record<string, string | null> = {
    summary,
    bull: bullCase,
    bear: bearCase,
    watch: whatToWatch,
  };

  return (
    <>
      <div className={styles.insightTabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.insightTab} ${active === tab.key ? styles.insightTabActive : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.insightBody}>
        <p className={styles.insightText}>
          {content[active] || '—'}
        </p>
      </div>
    </>
  );
}
