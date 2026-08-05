import { cn } from '@/lib/cn';

/**
 * Text lockup wordmark. variant='metal' applies the metallic treatment —
 * counts against the one-metallic-per-viewport budget.
 */
export function Wordmark({
  variant = 'ink',
  size = 'md',
  className,
}: {
  variant?: 'metal' | 'ink' | 'reverse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: { name: 'text-lg', sub: 'text-[0.5rem]' },
    md: { name: 'text-2xl', sub: 'text-[0.56rem]' },
    lg: { name: 'text-4xl', sub: 'text-[0.66rem]' },
  }[size];

  const color =
    variant === 'metal' ? 'metal-text' : variant === 'reverse' ? 'text-ivory' : 'text-ink';

  return (
    <span className={cn('inline-flex flex-col items-center leading-none select-none', className)}>
      <span
        className={cn('display tracking-[0.28em]', sizes.name, color)}
        style={{ fontWeight: 600 }}
      >
        Revelle
      </span>
      <span
        className={cn(
          'eyebrow mt-1',
          sizes.sub,
          variant === 'reverse' ? 'text-gold-300' : 'text-gold-800',
        )}
      >
        Beauty
      </span>
    </span>
  );
}
