'use client';

import { useEffect, useState } from 'react';

type Report = {
  id: string;
  title: string;
  createdAt: string;
  generatedBy: { name: string };
  contentJson: {
    periodLabel: string;
    totalItems: number;
    sentimentBreakdown: { POS: number; NEU: number; NEG: number };
    topThemes: { name: string; count: number; deltaPct: number }[];
    sampleQuotes: string[];
    narrative: string;
  };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/reports');
    const data = await res.json();
    setReports(data.reports ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    setGenerating(true);
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodDays }),
    });
    const report = await res.json();
    setGenerating(false);
    if (res.ok) {
      await load();
      setSelected(report);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Voice-of-Customer reports</h1>
        <div className="flex items-center gap-2">
          <select value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))} className="input w-auto">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={generate} disabled={generating} className="btn-primary">
            {generating ? 'Generating…' : 'Generate report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">History</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-400">No reports yet.</p>
          ) : (
            <ul className="space-y-1">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelected(r)}
                    className={`w-full rounded-md px-2 py-2 text-left text-sm ${
                      selected?.id === r.id ? 'bg-brand-50 text-brand-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()} · {r.generatedBy.name}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2" id="report-print-area">
          {!selected ? (
            <p className="text-sm text-slate-400">Select a report, or generate a new one.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-900">{selected.title}</h2>
                  <p className="text-xs text-slate-400">{selected.contentJson.periodLabel}</p>
                </div>
                <button onClick={() => window.print()} className="btn-secondary text-xs">
                  Export / Print
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <StatBlock label="Total items" value={selected.contentJson.totalItems} />
                <StatBlock label="Positive" value={selected.contentJson.sentimentBreakdown.POS} />
                <StatBlock label="Negative" value={selected.contentJson.sentimentBreakdown.NEG} />
              </div>

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {selected.contentJson.narrative}
              </div>

              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase text-slate-400">Top themes</h3>
                <ul className="text-sm text-slate-600">
                  {selected.contentJson.topThemes.map((t) => (
                    <li key={t.name}>
                      {t.name} — {t.count} items ({t.deltaPct >= 0 ? '+' : ''}{t.deltaPct}%)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 py-3">
      <p className="text-xl font-semibold text-brand-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
