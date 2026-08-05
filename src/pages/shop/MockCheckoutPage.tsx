import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { mockPay } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/brand/GoldRule';

/**
 * DEV ONLY — stands in for the Stripe-hosted page while no Stripe keys are
 * configured. Calls the dev-only mock-pay endpoint, then lands on the same
 * success page the real flow uses.
 */
export function MockCheckoutPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') ?? '';
  const navigate = useNavigate();
  const [name, setName] = useState('Test Customer');
  const [email, setEmail] = useState('test@example.com');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setPaying(true);
    setError(null);
    try {
      await mockPay(sessionId, name, email);
      navigate(`/checkout/success?session_id=${sessionId}`, { replace: true });
    } catch {
      setError('Mock payment failed — is the backend running?');
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-gutter py-20">
      <div className="bg-porcelain border border-hairline rounded-sm p-8">
        <p className="eyebrow text-gold-950">Development checkout</p>
        <h1 className="font-display text-h2 text-ink mt-3">Simulated payment</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Stripe keys aren't configured, so this page stands in for the Stripe
          checkout. Clicking pay marks the order paid through the same
          server-side path the real webhook uses.
        </p>
        <GoldRule className="my-6" />
        <label className="block">
          <span className="eyebrow text-ink-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full bg-ivory-deep border border-hairline rounded-xs px-4 py-3 text-sm text-ink"
          />
        </label>
        <label className="block mt-4">
          <span className="eyebrow text-ink-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full bg-ivory-deep border border-hairline rounded-xs px-4 py-3 text-sm text-ink"
          />
        </label>
        {error && <p className="mt-4 text-xs text-ink-soft">{error}</p>}
        <Button variant="metal" size="lg" className="w-full mt-8" loading={paying} onClick={pay}>
          Pay (simulated)
        </Button>
        <button
          onClick={() => navigate('/cart')}
          className="mt-4 w-full text-center text-xs text-ink-muted link-ink cursor-pointer"
        >
          Cancel and return to bag
        </button>
      </div>
    </div>
  );
}
