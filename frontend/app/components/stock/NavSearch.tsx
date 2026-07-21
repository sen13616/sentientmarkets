'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import styles from '../AssetPage.module.css';
import { navigateToTicker } from '@/lib/navigation';

export default function NavSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const value = inputRef.current?.value ?? '';
      if (!value.trim()) return;
      if (inputRef.current) inputRef.current.value = '';
      navigateToTicker(router, value);
    }
  }

  return (
    <div className={styles.navSearchWrap}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.2" />
        <path d="M10 10L12.5 12.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        className={styles.navSearch}
        placeholder="Search ticker or company — AAPL, Tesla…"
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
