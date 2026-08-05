/** 44px touch targets, hairline border, aria-live announces changes. */
export function QuantityStepper({
  value,
  min = 1,
  max = 10,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-stretch border border-hairline rounded-xs bg-porcelain">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-11 h-11 text-ink hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        −
      </button>
      <span
        className="w-11 h-11 grid place-items-center text-sm tabular text-ink border-x border-hairline"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-11 h-11 text-ink hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
