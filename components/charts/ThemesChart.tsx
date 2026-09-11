'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from './VolumeChart';

export default function ThemesChart({
  themes,
}: {
  themes: { name: string; color: string; count: number }[];
}) {
  if (themes.length === 0) {
    return <EmptyState label="No themes yet — ingest some feedback to see clustering." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={themes} layout="vertical" margin={{ left: 24 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {themes.map((t) => (
            <Cell key={t.name} fill={t.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
