import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export function Register() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (token) {
    return <Navigate to="/orders" replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('orderhub', '/auth/register', {
        method: 'POST',
        body: { companyName, email, password },
      });
      const result = await api<{ accessToken: string }>(
        'orderhub',
        '/auth/login',
        { method: 'POST', body: { email, password } },
      );
      login(result.accessToken);
      navigate('/orders');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Create your company</h1>
      <label>
        Company name
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Register</button>
      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
