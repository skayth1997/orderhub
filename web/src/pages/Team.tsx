import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import type { Role, TeamUser } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import {
  Card,
  EmptyState,
  ErrorBox,
  Field,
  PageHeader,
  RoleBadge,
  SkeletonRows,
  buttonClass,
  inputClass,
} from '../ui';

const roleHelp: Record<Role, string> = {
  admin: 'Can do everything, including managing the team and stock.',
  manager: 'Can create and read orders.',
  viewer: 'Can only read orders.',
};

export function Team() {
  const { role: myRole } = useAuth();
  const queryClient = useQueryClient();
  const notify = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [submitted, setSubmitted] = useState(false);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['team'],
    queryFn: () => api<TeamUser[]>('orderhub', '/users'),
    enabled: myRole === 'admin',
  });

  const add = useMutation({
    mutationFn: () =>
      api('orderhub', '/users', {
        method: 'POST',
        body: { email: email.trim(), password, role },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      notify(`${email.trim()} was added as ${role}.`);
      setEmail('');
      setPassword('');
      setRole('viewer');
      setSubmitted(false);
    },
  });

  if (myRole !== 'admin') {
    return (
      <Card>
        <EmptyState
          title="Only admins can manage the team"
          text="Ask an admin of your company if you need a change."
        />
      </Card>
    );
  }

  const errors = {
    email: /^\S+@\S+\.\S+$/.test(email.trim())
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
    if (!errors.email && !errors.password) {
      add.mutate();
    }
  }

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="People who can log in to your company."
      />

      <Card title="Add a user" narrow>
        <form onSubmit={submit} noValidate>
          <Field label="Email" error={submitted ? errors.email : undefined}>
            <input
              className={inputClass}
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            label="Password"
            error={submitted ? errors.password : undefined}
          >
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Role">
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {roleHelp[role]}
            </span>
          </Field>
          <ErrorBox error={add.error} />
          <button
            className={buttonClass}
            type="submit"
            disabled={add.isPending}
          >
            {add.isPending ? 'Adding...' : 'Add user'}
          </button>
        </form>
      </Card>

      <Card title="Users">
        <ErrorBox error={error} onRetry={() => void refetch()} />
        {isPending && !error && <SkeletonRows rows={3} />}
        {data && data.length === 0 && <EmptyState title="No users yet" />}
        {data && data.length > 0 && (
          <ul>
            {data.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm"
              >
                <span className="min-w-0 truncate">{user.email}</span>
                <RoleBadge role={user.role} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
