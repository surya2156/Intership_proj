'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/trends', label: 'Trends' },
  { href: '/ask', label: 'Ask LOOP' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export default function NavBar({
  user,
}: {
  user: { name: string; role: string };
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-brand-900">LOOP</span>
          <nav className="hidden gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-brand-50 text-brand-600">{user.role}</span>
          <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary text-xs">
            Sign out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              pathname === link.href ? 'bg-brand-50 text-brand-600' : 'text-slate-600'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
