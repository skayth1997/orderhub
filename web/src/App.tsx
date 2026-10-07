import type { ReactElement } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Login } from './pages/Login';
import { NewOrder } from './pages/NewOrder';
import { Notifications } from './pages/Notifications';
import { Orders } from './pages/Orders';
import { Register } from './pages/Register';
import { Stock } from './pages/Stock';

function RequireLogin({ children }: { children: ReactElement }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function protectedRoute(path: string, page: ReactElement) {
  return <Route path={path} element={<RequireLogin>{page}</RequireLogin>} />;
}

export function App() {
  const { token, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {token && (
        <nav className="flex items-center gap-5 border-b border-slate-200 bg-white px-6 py-3 text-sm">
          <strong>OrderHub</strong>
          <Link className="hover:text-blue-600" to="/orders">
            Orders
          </Link>
          {role !== 'viewer' && (
            <Link className="hover:text-blue-600" to="/orders/new">
              New order
            </Link>
          )}
          <Link className="hover:text-blue-600" to="/stock">
            Stock
          </Link>
          <Link className="hover:text-blue-600" to="/notifications">
            Notifications
          </Link>
          <span className="flex-1" />
          <span className="text-slate-500">{role}</span>
          <button
            className="rounded-md border border-blue-600 px-3 py-1 text-blue-600 hover:bg-blue-50"
            onClick={logout}
          >
            Log out
          </button>
        </nav>
      )}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {protectedRoute('/orders', <Orders />)}
          {protectedRoute('/orders/new', <NewOrder />)}
          {protectedRoute('/stock', <Stock />)}
          {protectedRoute('/notifications', <Notifications />)}
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </main>
    </div>
  );
}
