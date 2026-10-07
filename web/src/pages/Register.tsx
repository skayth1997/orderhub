import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Card, ErrorText, Field, buttonClass, inputClass } from '../ui';

export function Register() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api('orderhub', '/auth/register', {
        method: 'POST',
        body: { companyName, email, password },
      });
      return api<{ accessToken: string }>('orderhub', '/auth/login', {
        method: 'POST',
        body: { email, password },
      });
    },
    onSuccess: (result) => {
      login(result.accessToken);
      navigate('/orders');
    },
  });

  if (token) {
    return <Navigate to="/orders" replace />;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Card title="Register your company" narrow>
      <form onSubmit={submit}>
        <Field label="Company name">
          <input
            className={inputClass}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <ErrorText error={mutation.error} />
        <button
          className={buttonClass}
          type="submit"
          disabled={mutation.isPending}
        >
          Register
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{' '}
          <Link className="text-blue-600 hover:underline" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </Card>
  );
}
