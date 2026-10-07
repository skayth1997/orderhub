import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import { ErrorBox, Field, buttonClass, inputClass } from '../ui';
import { AuthShell } from './AuthShell';

export function Register() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await api('orderhub', '/auth/register', {
        method: 'POST',
        body: { companyName: companyName.trim(), email, password },
      });
      return api<{ accessToken: string }>('orderhub', '/auth/login', {
        method: 'POST',
        body: { email, password },
      });
    },
    onSuccess: (result) => {
      login(result.accessToken);
      notify('Your company was created. You are the admin.');
      navigate('/orders');
    },
  });

  if (token) {
    return <Navigate to="/orders" replace />;
  }

  const errors = {
    companyName: companyName.trim() ? undefined : 'Enter your company name.',
    email: /^\S+@\S+\.\S+$/.test(email)
      ? undefined
      : 'Enter a valid email address.',
    password:
      password.length >= 8
        ? undefined
        : 'The password needs at least 8 characters.',
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!errors.companyName && !errors.email && !errors.password) {
      mutation.mutate();
    }
  }

  return (
    <AuthShell title="Register your company">
      <form onSubmit={submit} noValidate>
        <Field
          label="Company name"
          error={submitted ? errors.companyName : undefined}
        >
          <input
            className={inputClass}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </Field>
        <Field label="Email" error={submitted ? errors.email : undefined}>
          <input
            className={inputClass}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" error={submitted ? errors.password : undefined}>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
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
          {mutation.isPending ? 'Creating...' : 'Register'}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link className="text-blue-600 hover:underline" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
