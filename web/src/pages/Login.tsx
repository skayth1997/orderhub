import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Card, ErrorText, Field, buttonClass, inputClass } from '../ui';

export function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api<{ accessToken: string }>('orderhub', '/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
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
    <Card title="Log in" narrow>
      <form onSubmit={submit}>
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
          Log in
        </button>
        <p className="mt-4 text-sm text-slate-500">
          New here?{' '}
          <Link className="text-blue-600 hover:underline" to="/register">
            Create a company
          </Link>
        </p>
      </form>
    </Card>
  );
}
