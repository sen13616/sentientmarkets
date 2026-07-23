'use client';

/**
 * Contact form → POST {API_URL}/api/contact (APIACESSPAGE.md §3.3). The
 * hidden `website` field is a honeypot: bots that fill it get a silent
 * success server-side and no email is sent. Always submitted as-is.
 */

import { useState, type FormEvent } from 'react';
import { API_URL } from '../../lib/api';

type SendState = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactSection() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<SendState>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message, website }),
      });
      if (res.ok) {
        setState('sent');
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setError('Too many messages from this connection — wait an hour and resend.');
      } else if (res.status === 400 && typeof body?.error === 'string') {
        setError(body.error);
      } else {
        setError('Couldn’t send — email aayudh.sen@gmail.com directly.');
      }
      setState('error');
    } catch {
      setError('Couldn’t send — email aayudh.sen@gmail.com directly.');
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="bg-white border border-[#dee1e6] rounded-xl p-6 max-w-xl mx-auto text-center">
        <div className="text-sm font-semibold text-[#05b169] mb-1.5">Message sent.</div>
        <p className="text-xs text-[#5b616e] leading-relaxed">
          Replies go straight to your inbox — check {email || 'your email'} in the next day or two.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-[#dee1e6] rounded-xl p-6 max-w-xl mx-auto">
      <label className="block text-xs font-semibold text-[#0a0b0d] mb-1.5" htmlFor="contact-email">
        Your email
      </label>
      <input
        id="contact-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full text-sm text-[#0a0b0d] bg-[#f7f7f7] border border-[#eef0f3] rounded-lg px-3 py-2.5 mb-4 outline-none focus:border-[#0052ff] transition-colors placeholder:text-[#7c828a]"
      />

      <label className="block text-xs font-semibold text-[#0a0b0d] mb-1.5" htmlFor="contact-message">
        Message
      </label>
      <textarea
        id="contact-message"
        required
        maxLength={5000}
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Questions, integrations, Pro interest — anything."
        className="w-full text-sm text-[#0a0b0d] bg-[#f7f7f7] border border-[#eef0f3] rounded-lg px-3 py-2.5 mb-4 outline-none focus:border-[#0052ff] transition-colors resize-y placeholder:text-[#7c828a]"
      />

      {/* Honeypot — humans never see it; bots that fill it are dropped. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bg-[#0052ff] hover:bg-[#003ecc] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {error && <p className="text-xs text-[#cf202f] leading-relaxed">{error}</p>}
      </div>
    </form>
  );
}
