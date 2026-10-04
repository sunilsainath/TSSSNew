/**
 * Dependency free bar chart rendered as accessible SVG.
 *
 * Avoids pulling in a charting library for two simple dashboard visuals.
 */
export function SimpleBarChart({
  data,
  valueLabel,
  emptyLabel = "No data yet.",
  height = 160,
}: {
  data: Array<{ label: string; value: number }>;
  valueLabel?: (value: number) => string;
  emptyLabel?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }} role="img" aria-label="Bar chart">
        {data.map((item) => {
          const barHeight = Math.max(2, Math.round((item.value / max) * (height - 24)));
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[0.6rem] font-semibold text-slate-500">
                {valueLabel ? valueLabel(item.value) : item.value}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300 transition-all"
                style={{ height: barHeight }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1">
        {data.map((item, index) => (
          <span
            key={`${item.label}-${index}`}
            className="flex-1 text-center text-[0.55rem] text-slate-400"
          >
            {index % 2 === 0 ? item.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutSummary({
  segments,
}: {
  segments: Array<{ label: string; value: number; className: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => {
        const percent = Math.round((segment.value / total) * 100);
        return (
          <div key={segment.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{segment.label}</span>
              <span className="font-semibold text-ink-800">
                {segment.value} ({percent}%)
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${segment.className}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
