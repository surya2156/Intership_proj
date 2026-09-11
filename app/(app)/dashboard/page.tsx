'use client';

import { useEffect, useState } from 'react';
import VolumeChart from '@/components/charts/VolumeChart';
import SentimentChart from '@/components/charts/SentimentChart';
import ThemesChart from '@/components/charts/ThemesChart';

type DashboardData = {
  stats: { totalItems: number; negativePct: number; newThisWeek: number };
  volumeSeries: { date: string; count: number }[];
  sentimentBreakdown: { POS: number; NEU: number; NEG: number; unclassified: number };
  topThemes: { name: string; color: string; count: number }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading || !data ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total feedback items" value={data.stats.totalItems} />
            <StatCard label="% negative" value={`${data.stats.negativePct}%`} />
            <StatCard label="New this week" value={data.stats.newThisWeek} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Volume over time</h2>
              <VolumeChart data={data.volumeSeries} />
            </div>
            <div className="card">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Sentiment breakdown</h2>
              <SentimentChart breakdown={data.sentimentBreakdown} />
            </div>
            <div className="card">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Top themes</h2>
              <ThemesChart themes={data.topThemes} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-brand-900">{value}</p>
    </div>
  );
}
