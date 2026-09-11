'use client';

import { useState } from 'react';

const CHANNELS = ['Support Ticket', 'App Store Review', 'NPS Survey', 'Sales Call Notes', 'Community Post'];

export default function FeedbackForm({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [customerLabel, setCustomerLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, channel, customerLabel: customerLabel || undefined }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError('Could not add feedback.');
      return;
    }
    setContent('');
    setCustomerLabel('');
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">Add feedback</h2>
      <textarea
        className="input min-h-[80px]"
        placeholder="Paste or type a customer feedback item…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Customer label (optional)"
          value={customerLabel}
          onChange={(e) => setCustomerLabel(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Classifying with AI…' : 'Add & classify'}
      </button>
    </form>
  );
}
