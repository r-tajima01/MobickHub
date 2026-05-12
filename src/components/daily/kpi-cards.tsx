import { formatYen, formatPercent } from "@/lib/format";

type KpiProps = {
  label: string;
  value: string;
  target?: string;
  achievement?: number;
  meta?: string;
  icon?: React.ReactNode;
};

export function KpiCard({ label, value, target, achievement, meta, icon }: KpiProps) {
  const color =
    achievement === undefined
      ? "bg-muted"
      : achievement >= 90
      ? "bg-good"
      : achievement >= 70
      ? "bg-[#BA7517]"
      : "bg-bad";

  const textColor =
    achievement === undefined
      ? "text-muted"
      : achievement >= 90
      ? "text-good"
      : achievement >= 70
      ? "text-[#854F0B]"
      : "text-bad";

  return (
    <div className="bg-white border border-black/10 rounded-lg p-4">
      <div className="text-xs text-muted mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-medium tabular tracking-tight">{value}</span>
        {target && <span className="text-xs text-muted tabular">/ {target}</span>}
      </div>
      {achievement !== undefined && (
        <div className="mt-2 h-1.5 bg-line rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.min(100, achievement)}%` }}
          />
        </div>
      )}
      <div className="mt-1.5 flex justify-between text-xs">
        <span className="text-muted">{meta}</span>
        {achievement !== undefined && (
          <span className={`font-medium tabular ${textColor}`}>
            {formatPercent(achievement)}
          </span>
        )}
      </div>
    </div>
  );
}
