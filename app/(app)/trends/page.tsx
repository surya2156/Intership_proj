'use client';

import { useEffect, useState } from 'react';

type ThemeTrend = {
  id: string;
  name: string;
  color: string;
  totalCount: number;
  currentPeriodCount: number;
  previousPeriodCount: number;
  deltaPct: number;
  isSpiking: boolean;
};

type DrillDown = {
  theme: { name: string };
  feedback: { id: string; content: string; channel: string; sentiment: string | null }[];
};

export default function TrendsPage() {
  const [themes, setThemes] = useState<ThemeTrend[]>([]);
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/themes?periodDays=${periodDays}`)
      .then((r) => r.json())
      .then((d) => setThemes(d.themes ?? []))
      .finally(() => setLoading(false));
  }, [periodDays]);

  async function openTheme(id: string) {
    const res = await fetch(`/api/themes/${id}`);
    const data = await res.json();
    setDrillDown(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Trends</h1>
        <select value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))} className="input w-auto">
          <option value={7}>Last 7 days vs prior 7</option>
          <option value={30}>Last 30 days vs prior 30</option>
          <option value={90}>Last 90 days vs prior 90</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : themes.length === 0 ? (
        <p className="card text-sm text-slate-400">No themes yet — ingest feedback to see trends.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="py-2 pr-3">Theme</th>
                <th className="py-2 pr-3">This period</th>
                <th className="py-2 pr-3">Prior period</th>
                <th className="py-2 pr-3">Change</th>
                <th className="py-2 pr-3">All-time</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((t) => (
                <tr key={t.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => openTheme(t.id)}>
                  <td className="py-3 pr-3 font-medium" style={{ color: t.color }}>
                    {t.name}
                    {t.isSpiking && <span className="badge ml-2 bg-red-100 text-red-700">spiking</span>}
                  </td>
                  <td className="py-3 pr-3">{t.currentPeriodCount}</td>
                  <td className="py-3 pr-3 text-slate-500">{t.previousPeriodCount}</td>
                  <td className={`py-3 pr-3 ${t.deltaPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.deltaPct >= 0 ? '+' : ''}{t.deltaPct}%
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{t.totalCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drillDown && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4" onClick={() => setDrillDown(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{drillDown.theme.name}</h2>
              <button onClick={() => setDrillDown(null)} className="btn-secondary text-xs">Close</button>
            </div>
            <ul className="space-y-3">
              {drillDown.feedback.map((f) => (
                <li key={f.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p>{f.content}</p>
                  <p className="mt-1 text-xs text-slate-400">{f.channel} · {f.sentiment ?? 'unclassified'}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
