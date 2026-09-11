'use client';

import { useState } from 'react';

const CHANNELS = ['App Store Review', 'NPS Survey', 'Sales Call Notes', 'Community Post'];

export default function ChannelSync({ onSynced }: { onSynced: () => void }) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function sync(channel: string) {
    setSyncing(channel);
    setLastResult(null);
    const res = await fetch('/api/feedback/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    });
    const data = await res.json();
    setSyncing(null);
    if (res.ok) {
      setLastResult(`Pulled ${data.imported} new items from ${channel}.`);
      onSynced();
    } else {
      setLastResult('Sync failed.');
    }
  }

  return (
    <div className="card space-y-2">
      <h2 className="text-sm font-semibold text-slate-700">Simulated channel sync</h2>
      <p className="text-xs text-slate-500">Mimics pulling a fresh batch from an external source.</p>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => sync(c)}
            disabled={syncing !== null}
            className="btn-secondary text-xs"
          >
            {syncing === c ? 'Syncing…' : `Sync "${c}"`}
          </button>
        ))}
      </div>
      {lastResult && <p className="text-xs text-slate-600">{lastResult}</p>}
    </div>
  );
}
