import { Link, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './auth';
import { Login } from './pages/Login';
import { NewOrder } from './pages/NewOrder';
import { Notifications } from './pages/Notifications';
import { Orders } from './pages/Orders';
import { Stock } from './pages/Stock';

function RequireLogin({ children }: { children: ReactElement }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export function App() {
  const { token, role, logout } = useAuth();

  return (
    <>
      {token && (
        <nav className="nav">
          <strong>OrderHub</strong>
          <Link to="/orders">Orders</Link>
          {role !== 'viewer' && <Link to="/orders/new">New order</Link>}
          <Link to="/stock">Stock</Link>
          <Link to="/notifications">Notifications</Link>
          <span className="spacer" />
          <span className="muted">{role}</span>
          <button onClick={logout}>Log out</button>
        </nav>
      )}
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/orders"
            element={
              <RequireLogin>
                <Orders />
              </RequireLogin>
            }
          />
          <Route
            path="/orders/new"
            element={
              <RequireLogin>
                <NewOrder />
              </RequireLogin>
            }
          />
          <Route
            path="/stock"
            element={
              <RequireLogin>
                <Stock />
              </RequireLogin>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireLogin>
                <Notifications />
              </RequireLogin>
            }
          />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </main>
    </>
  );
}
