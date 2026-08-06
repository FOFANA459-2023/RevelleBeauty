import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useCustomerLogin, useCustomerRegister } from '@/features/auth/useCustomer';
import { GoldRule } from '@/components/brand/GoldRule';
import { Button } from '@/components/ui/Button';

const inputCls =
  'mt-2 w-full bg-porcelain border border-hairline rounded-xs px-4 py-3 text-sm text-ink';
const labelCls = 'block text-left';
const labelText = 'eyebrow text-ink-muted';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useCustomerLogin();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/account';

  return (
    <div className="mx-auto max-w-md px-gutter py-16">
      <div className="text-center">
        <p className="eyebrow text-gold-950">Welcome back</p>
        <h1 className="display text-display-2 text-ink mt-4">Sign in</h1>
        <GoldRule ornament className="w-40 mt-6 mx-auto" />
      </div>
      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ email, password }, { onSuccess: () => navigate(next, { replace: true }) });
        }}
      >
        <label className={labelCls}>
          <span className={labelText}>Email</span>
          <input type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className={labelText}>Password</span>
          <input type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </label>
        {login.isError && (
          <p className="text-sm text-ink border border-hairline bg-ivory rounded-xs p-3">
            {login.error instanceof Error ? login.error.message : 'Sign in failed'}
          </p>
        )}
        <Button variant="metal" size="lg" className="w-full" loading={login.isPending} type="submit">
          Sign in
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-muted">
        New to Revelle?{' '}
        <Link to={`/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`} className="link-ink text-ink">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const register = useCustomerRegister();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/account';

  return (
    <div className="mx-auto max-w-md px-gutter py-16">
      <div className="text-center">
        <p className="eyebrow text-gold-950">Join Revelle</p>
        <h1 className="display text-display-2 text-ink mt-4">Create account</h1>
        <GoldRule ornament className="w-40 mt-6 mx-auto" />
      </div>
      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          register.mutate(
            { name, email, password, ...(phone ? { phone } : {}) },
            { onSuccess: () => navigate(next, { replace: true }) },
          );
        }}
      >
        <label className={labelCls}>
          <span className={labelText}>Full name</span>
          <input required autoComplete="name" value={name}
            onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className={labelText}>Email</span>
          <input type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className={labelText}>Phone</span>
          <input type="tel" autoComplete="tel" placeholder="For delivery updates" value={phone}
            onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className={labelText}>Password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          <span className="mt-1.5 block text-xs text-ink-muted">At least 8 characters.</span>
        </label>
        {register.isError && (
          <p className="text-sm text-ink border border-hairline bg-ivory rounded-xs p-3">
            {register.error instanceof Error ? register.error.message : 'Registration failed'}
          </p>
        )}
        <Button variant="metal" size="lg" className="w-full" loading={register.isPending} type="submit">
          Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to={`/login${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`} className="link-ink text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
}
