import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import { ErrorBox, Field, buttonClass, inputClass } from '../ui';
import { AuthShell } from './AuthShell';

export function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api<{ accessToken: string }>('orderhub', '/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    onSuccess: (result) => {
      login(result.accessToken);
      notify('Welcome back!');
      navigate('/orders');
    },
  });

  if (token) {
    return <Navigate to="/orders" replace />;
  }

  const emailError = !/^\S+@\S+\.\S+$/.test(email)
    ? 'Enter a valid email address.'
    : undefined;
  const passwordError = !password ? 'Enter your password.' : undefined;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!emailError && !passwordError) {
      mutation.mutate();
    }
  }

  return (
    <AuthShell title="Log in">
      <form onSubmit={submit} noValidate>
        <Field label="Email" error={submitted ? emailError : undefined}>
          <input
            className={inputClass}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" error={submitted ? passwordError : undefined}>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorBox error={mutation.error} />
        <button
          className={`${buttonClass} w-full`}
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Logging in...' : 'Log in'}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{' '}
          <Link className="text-blue-600 hover:underline" to="/register">
            Register your company
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
