'use client';

import { useEffect, useState, useCallback } from 'react';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import CsvImport from '@/components/feedback/CsvImport';
import ChannelSync from '@/components/feedback/ChannelSync';
import FeedbackTable from '@/components/feedback/FeedbackTable';

type Item = {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  status: string;
  featureArea: string | null;
  createdAt: string;
  themes: { theme: { id: string; name: string; color: string } }[];
};

const CHANNEL_OPTIONS = [
  'Support Ticket',
  'App Store Review',
  'NPS Survey',
  'Sales Call Notes',
  'Community Post',
];

export default function InboxPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    if (channel) params.set('channel', channel);
    if (sentiment) params.set('sentiment', sentiment);
    if (status) params.set('status', status);

    const res = await fetch(`/api/feedback?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, pageSize, search, channel, sentiment, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(id: string, newStatus: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function handleReclassify(id: string) {
    await fetch(`/api/feedback/${id}`, { method: 'POST' });
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Inbox</h1>
        <button onClick={() => setShowAddPanel((v) => !v)} className="btn-primary">
          {showAddPanel ? 'Hide ingestion' : '+ Add feedback'}
        </button>
      </div>

      {showAddPanel && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FeedbackForm onCreated={() => { load(); setPage(1); }} />
          <CsvImport onImported={() => { load(); setPage(1); }} />
          <ChannelSync onSynced={() => { load(); setPage(1); }} />
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="input max-w-xs"
            placeholder="Search feedback…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
          <select className="input w-auto" value={channel} onChange={(e) => { setPage(1); setChannel(e.target.value); }}>
            <option value="">All channels</option>
            {CHANNEL_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input w-auto" value={sentiment} onChange={(e) => { setPage(1); setSentiment(e.target.value); }}>
            <option value="">All sentiment</option>
            <option value="POS">Positive</option>
            <option value="NEU">Neutral</option>
            <option value="NEG">Negative</option>
          </select>
          <select className="input w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
          </select>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
        ) : (
          <FeedbackTable items={items} onStatusChange={handleStatusChange} onReclassify={handleReclassify} />
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>{total} total items</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-xs">
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-xs">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
