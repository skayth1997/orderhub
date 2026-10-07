import type { ReactNode } from 'react';

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-2xl font-semibold text-slate-900">
          OrderHub
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-5 text-xl font-semibold text-slate-900">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
