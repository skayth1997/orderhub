import type { ReactNode } from 'react';

export const inputClass =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export const buttonClass =
  'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300';

export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title,
  children,
  narrow = false,
}: {
  title?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${narrow ? 'max-w-md' : ''}`}
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      )}
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error && (
        <span className="mt-1 block text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      {label}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-6 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry?: () => void;
}) {
  if (!error) {
    return null;
  }
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <span>{error.message}</span>
      {onRetry && (
        <button className={secondaryButtonClass} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    viewer: 'bg-slate-100 text-slate-600',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? colors.viewer}`}
    >
      {role}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.pending}`}
    >
      {status === 'pending' && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
      )}
      {status}
    </span>
  );
}

export function Pager({
  page,
  hasNext,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <button
        className={secondaryButtonClass}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>Page {page}</span>
      <button
        className={secondaryButtonClass}
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
