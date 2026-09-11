'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Member = { id: string; name: string; email: string; role: string };

export default function SettingsPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ANALYST' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  async function load() {
    setLoading(true);
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not add member.');
      return;
    }
    setForm({ name: '', email: '', password: '', role: 'ANALYST' });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Settings — Members & Roles</h1>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Workspace members</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{m.name}</td>
                  <td className="py-2 pr-3 text-slate-500">{m.email}</td>
                  <td className="py-2 pr-3">
                    <span className="badge bg-brand-50 text-brand-600">{m.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAdmin ? (
        <form onSubmit={handleInvite} className="card max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Add a teammate</h2>
          <input
            className="input"
            placeholder="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Temporary password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="ANALYST">Analyst</option>
            <option value="VIEWER">Viewer</option>
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Adding…' : 'Add member'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-400">Only Admins can add or manage members.</p>
      )}
    </div>
  );
}
