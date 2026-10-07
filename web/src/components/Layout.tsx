import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api';
import type { Me } from '../api';
import { useAuth } from '../auth';
import { COUNT_LIMIT, useUnreadCount } from '../unread';
import { RoleBadge, secondaryButtonClass } from '../ui';

function NavItem({
  to,
  label,
  badge,
}: {
  to: string;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
      }
    >
      {label}
      {badge ? (
        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
          {badge >= COUNT_LIMIT ? `${COUNT_LIMIT}+` : badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export function Layout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('orderhub', '/auth/me'),
  });
  const unread = useUnreadCount(me?.id);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-slate-900 p-4 transition-transform lg:static lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-6 px-3 text-lg font-semibold text-white">
          OrderHub
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavItem to="/orders" label="Orders" />
          <NavItem to="/stock" label="Stock" />
          <NavItem to="/notifications" label="Notifications" badge={unread} />
          {me?.role === 'admin' && <NavItem to="/team" label="Team" />}
        </nav>
        <div className="border-t border-slate-700 px-3 pt-4 text-sm lg:hidden">
          <div className="truncate text-slate-200">{me?.email}</div>
          <div className="mt-1 capitalize text-slate-400">{me?.role}</div>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="min-w-0 flex-1 truncate font-semibold text-slate-900">
            {me?.companyName ?? ' '}
          </div>
          <div className="hidden items-center gap-3 text-sm lg:flex">
            <span className="text-slate-600">{me?.email}</span>
            {me && <RoleBadge role={me.role} />}
          </div>
          <button className={secondaryButtonClass} onClick={logout}>
            Log out
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
