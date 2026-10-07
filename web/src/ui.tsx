import type { ReactNode } from 'react';

export const inputClass =
  'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export const buttonClass =
  'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300';

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
      className={`mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${narrow ? 'max-w-md' : ''}`}
    >
      {title && <h1 className="mb-4 text-xl font-semibold">{title}</h1>}
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm text-slate-600">
      {label}
      {children}
    </label>
  );
}

export function ErrorText({ error }: { error: Error | null }) {
  return error ? (
    <p className="mb-3 text-sm text-red-600">{error.message}</p>
  ) : null;
}
