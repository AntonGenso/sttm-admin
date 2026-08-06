interface Props {
  label: string;
  value?: number;
  icon: string;
  hint?: string;
  isLoading?: boolean;
}

/**
 * Counts stay readable at a glance: 1 284 up to five digits, 12.9K past that.
 * Proportional figures on purpose — `tabular-nums` looks loose at this size.
 */
const formatValue = (value: number) =>
  value < 10000
    ? value.toLocaleString("ru-RU")
    : `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;

/**
 * One headline number. No delta or sparkline: the API has no history behind
 * these counters, and an invented trend line would be a lie.
 */
export const StatTile = ({ label, value, icon, hint, isLoading }: Props) => (
  <div className="flex h-full flex-col gap-3 rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-6 backdrop-blur-md">
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[rgba(2,37,51,0.6)] text-xl"
      >
        {icon}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
        {label}
      </span>
    </div>

    <span className="text-6xl font-bold leading-none text-white">
      {isLoading || value === undefined ? "—" : formatValue(value)}
    </span>

    {hint && <span className="mt-auto text-base text-grey">{hint}</span>}
  </div>
);
