import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAdminLogin } from '@/features/admin/useAdmin';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';

export function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const login = useAdminLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/products';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(password, { onSuccess: () => navigate(from, { replace: true }) });
  };

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
          <span className="text-[13px] text-ink-soft">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="mt-1.5 w-full bg-ivory-deep border border-hairline rounded-md px-3.5 py-2.5 text-[14px] text-ink"
          />
        </label>
        {login.isError && (
          <p className="mt-3 text-[13px] text-ink font-medium">
            ✕ {login.error instanceof Error ? login.error.message : 'Login failed'}
          </p>
        )}
        <Button
          variant="solid"
          className="w-full mt-6"
          loading={login.isPending}
          type="submit"
        >
          Sign in
        </Button>
        <p className="mt-4 text-xs text-ink-muted text-center">
          Dev default password: <code className="tabular">revelle-admin</code>
        </p>
      </form>
    </div>
  );
}
