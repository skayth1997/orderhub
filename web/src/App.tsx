import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { NewOrder } from './pages/NewOrder';
import { NotFound } from './pages/NotFound';
import { Notifications } from './pages/Notifications';
import { Orders } from './pages/Orders';
import { Register } from './pages/Register';
import { Stock } from './pages/Stock';
import { Team } from './pages/Team';

function RequireLogin({ children }: { children: ReactElement }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <RequireLogin>
            <Layout />
          </RequireLogin>
        }
      >
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<NewOrder />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/team" element={<Team />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
