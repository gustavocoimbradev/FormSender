type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

const GAP = 4; // px between options (and the padding of the track)

/**
 * A small custom choice (instead of a native select). The highlight is one
 * element that slides to the chosen option, so it never disappears and reappears.
 */
export function Segmented<T extends string>({ label, value, options, onChange, disabled }: SegmentedProps<T>) {
  const count = options.length;
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <div className="mb-4">
      <span id="segmented-label" className="mb-2 block text-base font-medium text-text/90">
        {label}
      </span>

      <div
        role="radiogroup"
        aria-labelledby="segmented-label"
        className="relative grid h-14 grid-flow-col auto-cols-fr rounded-control border border-surface/10 bg-surface/[0.04]"
        style={{ padding: GAP, gap: GAP }}
      >
        <span
          aria-hidden="true"
          data-testid="segmented-indicator"
          className="absolute rounded-[0.6rem] bg-accent shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.7)] transition-transform duration-[420ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            top: GAP,
            bottom: GAP,
            left: GAP,
            width: `calc((100% - ${GAP * 2}px - ${(count - 1) * GAP}px) / ${count})`,
            transform: `translateX(calc(${index} * (100% + ${GAP}px)))`,
          }}
        />

        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`relative z-10 rounded-[0.6rem] text-base font-medium transition-colors duration-300 ease-out ${
                active ? "text-white" : "text-muted hover:text-text"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
