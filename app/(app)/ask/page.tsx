'use client';

import { useState } from 'react';

type Source = { id: string; content: string; channel: string; sentiment: string | null; relevance: number };
type Turn = { question: string; answer: string; sources: Source[] };

const SAMPLE_QUESTIONS = [
  'What are users saying about onboarding?',
  'Are there complaints about billing?',
  'What do customers like most about the mobile app?',
];

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion('');

    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    setLoading(false);
    setTurns((prev) => [...prev, { question: q, answer: data.answer, sources: data.sources ?? [] }]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Ask LOOP</h1>
      <p className="text-sm text-slate-500">
        Ask a plain-English question. Answers are grounded in your actual feedback — LOOP will say so if it
        can't find enough evidence.
      </p>

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <button key={q} onClick={() => ask(q)} className="btn-secondary text-xs">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {turns.map((t, i) => (
          <div key={i} className="card space-y-3">
            <p className="font-medium text-brand-900">You asked: {t.question}</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{t.answer}</p>
            {t.sources.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Grounded in</p>
                <ul className="space-y-1">
                  {t.sources.map((s) => (
                    <li key={s.id} className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                      <span className="font-medium">{s.channel}</span> — {s.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-slate-400">Retrieving relevant feedback and answering…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="sticky bottom-4 flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
      >
        <input
          className="input flex-1 border-none focus:ring-0"
          placeholder="Ask a question about your feedback…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary">
          Ask
        </button>
      </form>
    </div>
  );
}
