import type { FulfillmentStage, OrderEventDTO } from '@contracts/index';
import { Sparkle } from '@/components/brand/Sparkle';
import { cn } from '@/lib/cn';

const STAGES: { key: FulfillmentStage; label: string }[] = [
  { key: 'payment_received', label: 'Payment received' },
  { key: 'packaged', label: 'Packaged' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const ORDER: FulfillmentStage[] = [
  'awaiting_payment', 'payment_received', 'packaged', 'shipped', 'delivered',
];

/** Gold progress steps + the event log. Neutral palette; gold marks progress. */
export function TrackingTimeline({
  stage,
  events,
}: {
  stage: FulfillmentStage;
  events: OrderEventDTO[];
}) {
  const currentIdx = ORDER.indexOf(stage);

  return (
    <div>
      {/* stepper */}
      <ol className="flex items-start" aria-label="Order progress">
        {STAGES.map((s, i) => {
          const stepIdx = ORDER.indexOf(s.key);
          const reached = currentIdx >= stepIdx;
          const isCurrent = stage === s.key;
          return (
            <li key={s.key} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[13px] right-1/2 w-full h-px',
                    currentIdx >= stepIdx ? 'bg-gold-700' : 'bg-hairline',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 w-7 h-7 rounded-full grid place-items-center border transition-colors',
                  reached
                    ? 'metal-surface border-transparent'
                    : 'bg-porcelain border-hairline',
                )}
              >
                {reached ? (
                  <Sparkle size={11} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-hairline" />
                )}
              </span>
              <span
                className={cn(
                  'mt-2.5 eyebrow text-[0.56rem] text-center px-1',
                  isCurrent ? 'text-ink' : reached ? 'text-ink-soft' : 'text-ink-muted',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* event log */}
      {events.length > 0 && (
        <ul className="mt-8 space-y-0 border-l border-hairline ml-1.5">
          {[...events].reverse().map((e) => (
            <li key={e.id} className="relative pl-6 pb-5 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-gold-500 border-2 border-ivory"
              />
              <p className="text-sm text-ink">
                {e.note ?? e.stage?.replace(/_/g, ' ') ?? 'Update'}
                {e.actor === 'customer' && (
                  <span className="ml-2 eyebrow text-[0.5rem] text-gold-950 border border-gold-500 rounded px-1.5 py-0.5">
                    You
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 tabular">
                {new Date(e.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
