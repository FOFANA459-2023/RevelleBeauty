import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAdminLogin } from '@/features/admin/useAdmin';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAdminLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/products';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => navigate(from, { replace: true }) });
  };

  const input =
    'mt-1.5 w-full bg-ivory-deep border border-hairline rounded-md px-3.5 py-2.5 text-[14px] text-ink';

  return (
    <div className="min-h-dvh bg-ivory grid place-items-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-porcelain border border-hairline rounded-md p-8"
      >
        <div className="text-center mb-8">
          <Wordmark variant="ink" size="md" />
          <p className="eyebrow text-[0.6rem] text-ink-muted mt-3">Admin sign in</p>
        </div>
        <label className="block">
          <span className="text-[13px] text-ink-soft">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
            autoComplete="username"
            className={input}
          />
        </label>
        <label className="block mt-4">
          <span className="text-[13px] text-ink-soft">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={input}
          />
        </label>
        {login.isError && (
          <p className="mt-3 text-[13px] text-ink font-medium">
            ✕ {login.error instanceof Error ? login.error.message : 'Login failed'}
          </p>
        )}
        <Button variant="solid" className="w-full mt-6" loading={login.isPending} type="submit">
          Sign in
        </Button>
      </form>
    </div>
  );
}
