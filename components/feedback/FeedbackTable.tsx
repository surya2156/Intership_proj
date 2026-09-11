'use client';

const SENTIMENT_STYLES: Record<string, string> = {
  POS: 'bg-green-100 text-green-700',
  NEU: 'bg-slate-100 text-slate-600',
  NEG: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['NEW', 'REVIEWED', 'ACTIONED'];

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

export default function FeedbackTable({
  items,
  onStatusChange,
  onReclassify,
}: {
  items: Item[];
  onStatusChange: (id: string, status: string) => void;
  onReclassify: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No feedback matches these filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <th className="py-2 pr-3">Feedback</th>
            <th className="py-2 pr-3">Channel</th>
            <th className="py-2 pr-3">Sentiment</th>
            <th className="py-2 pr-3">Themes</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 align-top">
              <td className="max-w-xs py-3 pr-3">
                <p className="line-clamp-2">{item.content}</p>
                {item.featureArea && <p className="mt-1 text-xs text-slate-400">{item.featureArea}</p>}
              </td>
              <td className="py-3 pr-3 text-slate-600">{item.channel}</td>
              <td className="py-3 pr-3">
                {item.sentiment ? (
                  <span className={`badge ${SENTIMENT_STYLES[item.sentiment]}`}>{item.sentiment}</span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-400">pending</span>
                )}
              </td>
              <td className="py-3 pr-3">
                <div className="flex flex-wrap gap-1">
                  {item.themes.map((t) => (
                    <span
                      key={t.theme.id}
                      className="badge"
                      style={{ backgroundColor: `${t.theme.color}22`, color: t.theme.color }}
                    >
                      {t.theme.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 pr-3">
                <select
                  value={item.status}
                  onChange={(e) => onStatusChange(item.id, e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 pr-3 whitespace-nowrap text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 pr-3">
                <button onClick={() => onReclassify(item.id)} className="text-xs text-brand-500 hover:underline">
                  Re-classify
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
