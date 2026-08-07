import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  useCustomerLogin,
  useCustomerRegister,
  useForgotPassword,
  useResetPassword,
} from '@/features/auth/useCustomer';
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
  const justReset = params.get('reset') === '1';

  return (
    <div className="mx-auto max-w-md px-gutter py-16">
      <div className="text-center">
        <p className="eyebrow text-gold-950">Welcome back</p>
        <h1 className="display text-display-2 text-ink mt-4">Sign in</h1>
        <GoldRule ornament className="w-40 mt-6 mx-auto" />
      </div>
      {justReset && (
        <p className="mt-8 text-sm text-ink border border-gold-300 bg-gold-50 rounded-xs p-3 text-center">
          Your password has been updated — sign in with your new password.
        </p>
      )}
      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate(
            { email, password },
            {
              onSuccess: (customer) => {
                // Admins land on the dashboard unless they asked for a
                // specific page; customers keep the normal flow.
                const dest =
                  customer.role === 'admin' && !params.get('next') ? '/admin' : next;
                navigate(dest, { replace: true });
              },
            },
          );
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
        <p className="text-right text-sm">
          <Link to="/forgot-password" className="link-ink text-ink-muted">
            Forgot password?
          </Link>
        </p>
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const forgot = useForgotPassword();

  return (
    <div className="mx-auto max-w-md px-gutter py-16">
      <div className="text-center">
        <p className="eyebrow text-gold-950">Account recovery</p>
        <h1 className="display text-display-2 text-ink mt-4">Forgot password</h1>
        <GoldRule ornament className="w-40 mt-6 mx-auto" />
      </div>
      {forgot.isSuccess ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-ink border border-gold-300 bg-gold-50 rounded-xs p-4">
            If an account exists for <span className="font-medium">{email}</span>, a reset link is
            on its way. Check your inbox — the link expires in an hour.
          </p>
          <p className="mt-6 text-sm text-ink-muted">
            Nothing arriving? Check your spam folder, or{' '}
            <button type="button" className="link-ink text-ink" onClick={() => forgot.reset()}>
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-center text-sm text-ink-muted">
            Enter the email you signed up with and we&rsquo;ll send you a link to choose a new
            password.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              forgot.mutate(email);
            }}
          >
            <label className={labelCls}>
              <span className={labelText}>Email</span>
              <input type="email" required autoComplete="username" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </label>
            {forgot.isError && (
              <p className="text-sm text-ink border border-hairline bg-ivory rounded-xs p-3">
                {forgot.error instanceof Error ? forgot.error.message : 'Something went wrong — try again'}
              </p>
            )}
            <Button variant="metal" size="lg" className="w-full" loading={forgot.isPending} type="submit">
              Send reset link
            </Button>
          </form>
        </>
      )}
      <p className="mt-8 text-center text-sm text-ink-muted">
        Remembered it after all?{' '}
        <Link to="/login" className="link-ink text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const reset = useResetPassword();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-gutter py-16 text-center">
        <p className="eyebrow text-gold-950">Account recovery</p>
        <h1 className="display text-display-2 text-ink mt-4">Reset password</h1>
        <GoldRule ornament className="w-40 mt-6 mx-auto" />
        <p className="mt-10 text-sm text-ink border border-hairline bg-ivory rounded-xs p-4">
          This reset link is missing its token — it may have been cut off by your email app.
        </p>
        <p className="mt-6 text-sm text-ink-muted">
          <Link to="/forgot-password" className="link-ink text-ink">
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-gutter py-16">
      <div className="text-center">
        <p className="eyebrow text-gold-950">Almost there</p>
        <h1 className="display text-display-2 text-ink mt-4">Choose a new password</h1>
        <GoldRule ornament className="w-40 mt-6 mx-auto" />
      </div>
      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirm) {
            setMismatch(true);
            return;
          }
          setMismatch(false);
          reset.mutate(
            { token, password },
            // Straight back to sign-in, with a banner confirming the change.
            { onSuccess: () => navigate('/login?reset=1', { replace: true }) },
          );
        }}
      >
        <label className={labelCls}>
          <span className={labelText}>New password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          <span className="mt-1.5 block text-xs text-ink-muted">At least 8 characters.</span>
        </label>
        <label className={labelCls}>
          <span className={labelText}>Confirm new password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </label>
        {mismatch && (
          <p className="text-sm text-ink border border-hairline bg-ivory rounded-xs p-3">
            Passwords don&rsquo;t match — try again.
          </p>
        )}
        {reset.isError && (
          <p className="text-sm text-ink border border-hairline bg-ivory rounded-xs p-3">
            {reset.error instanceof Error ? reset.error.message : 'Reset failed — try again'}{' '}
            <Link to="/forgot-password" className="link-ink text-ink">
              Request a new link
            </Link>
          </p>
        )}
        <Button variant="metal" size="lg" className="w-full" loading={reset.isPending} type="submit">
          Set new password
        </Button>
      </form>
    </div>
  );
}
