'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EmptyState } from './VolumeChart';

const COLORS: Record<string, string> = {
  Positive: '#22c55e',
  Neutral: '#94a3b8',
  Negative: '#ef4444',
  Unclassified: '#e2e8f0',
};

export default function SentimentChart({
  breakdown,
}: {
  breakdown: { POS: number; NEU: number; NEG: number; unclassified: number };
}) {
  const data = [
    { name: 'Positive', value: breakdown.POS },
    { name: 'Neutral', value: breakdown.NEU },
    { name: 'Negative', value: breakdown.NEG },
    { name: 'Unclassified', value: breakdown.unclassified },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <EmptyState label="No classified feedback yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
