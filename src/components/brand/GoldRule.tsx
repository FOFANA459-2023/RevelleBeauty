import type { HTMLAttributes } from 'react';
import { Sparkle } from './Sparkle';
import { cn } from '@/lib/cn';

/** Hairline gold rule, optionally with the centered sparkle ornament. */
export function GoldRule({
  ornament = false,
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  ornament?: boolean;
}) {
  if (!ornament) {
    return <hr className={cn('border-0 h-px bg-gold-300', className)} {...rest} />;
  }
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator" {...rest}>
      <span className="h-px flex-1 bg-gold-300" />
      <Sparkle size={12} className="text-gold-500" />
      <span className="h-px flex-1 bg-gold-300" />
    </div>
  );
}
