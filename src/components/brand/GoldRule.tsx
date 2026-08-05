import { Sparkle } from './Sparkle';
import { cn } from '@/lib/cn';

/** Hairline gold rule, optionally with the centered sparkle ornament. */
export function GoldRule({
  ornament = false,
  className,
}: {
  ornament?: boolean;
  className?: string;
}) {
  if (!ornament) {
    return <hr className={cn('border-0 h-px bg-gold-300', className)} />;
  }
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator">
      <span className="h-px flex-1 bg-gold-300" />
      <Sparkle size={12} className="text-gold-500" />
      <span className="h-px flex-1 bg-gold-300" />
    </div>
  );
}
