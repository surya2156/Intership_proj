'use client';

import { useRef, useState } from 'react';

export default function CsvImport({ onImported }: { onImported: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ imported: number; failed: number; total: number } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/feedback/csv', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    setResult(data);
    onImported();
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <div className="card space-y-2">
      <h2 className="text-sm font-semibold text-slate-700">Bulk import (CSV)</h2>
      <p className="text-xs text-slate-500">
        Columns: <code>content, channel, customer_label, created_at</code>
      </p>
      <input
        ref={fileInput}
        type="file"
        accept=".csv"
        disabled={uploading}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm"
      />
      {uploading && <p className="text-xs text-slate-500">Uploading & classifying…</p>}
      {result && (
        <p className="text-xs text-slate-600">
          Imported <strong>{result.imported}</strong> / {result.total} rows
          {result.failed > 0 && <span className="text-red-600"> ({result.failed} failed)</span>}
        </p>
      )}
    </div>
  );
}
