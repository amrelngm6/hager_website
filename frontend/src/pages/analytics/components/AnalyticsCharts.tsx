interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export function AreaChart({
  data,
  height = 200,
  color = '#6366f1',
  secondaryColor = '#3b82f6',
  valueFormatter = (v) => v.toLocaleString(),
}: {
  data: DataPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!data || data.length === 0) return null;

  const padding = 20;
  const width = 600;
  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)), 1);

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  let secondaryPoints = '';
  let secondaryArea = '';
  if (data.some((d) => d.secondaryValue !== undefined)) {
    const secPts = data
      .map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
        const y = height - padding - ((d.secondaryValue || 0) / maxVal) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');
    secondaryPoints = secPts;
    secondaryArea = `${padding},${height - padding} ${secPts} ${width - padding},${height - padding}`;
  }

  const gradientId = `area-grad-${color.replace('#', '')}`;
  const secGradId = `area-sec-grad-${secondaryColor.replace('#', '')}`;

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          {secondaryColor && (
            <linearGradient id={secGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.0" />
            </linearGradient>
          )}
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <line
              key={ratio}
              x1={padding} y1={y}
              x2={width - padding} y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Secondary */}
        {secondaryArea && <polygon points={secondaryArea} fill={`url(#${secGradId})`} />}
        {secondaryPoints && (
          <polyline fill="none" stroke={secondaryColor} strokeWidth="1.5" points={secondaryPoints} strokeLinecap="round" />
        )}

        {/* Primary */}
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
          return (
            <g key={i} className="group cursor-pointer">
              <circle cx={x} cy={y} r="3.5" fill={color} stroke="white" strokeWidth="2" />
              <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
            </g>
          );
        })}
      </svg>

      {/* X axis labels */}
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2">
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 180,
  color = '#6366f1',
  valueFormatter = (v) => String(v),
}: {
  data: DataPoint[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full flex items-end gap-1.5 pt-4 pb-2" style={{ height: `${height}px` }}>
      {data.map((item, idx) => {
        const heightPct = Math.round((item.value / maxVal) * 100);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
            <div className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
              {valueFormatter(item.value)}
            </div>
            <div
              className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
              style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: color }}
            />
            <span className="text-[10px] text-slate-400 mt-1.5 truncate w-full text-center group-hover:text-slate-600">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ProgressRing({
  percentage,
  size = 110,
  strokeWidth = 10,
  color = '#6366f1',
  label,
  sublabel,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-slate-900 font-mono">{percentage}%</span>
        {label && <span className="text-[10px] text-slate-500 font-medium">{label}</span>}
      </div>
      {sublabel && <span className="text-sm text-slate-500 mt-2 font-medium">{sublabel}</span>}
    </div>
  );
}

export function StatusDistributionBar({
  status2xx,
  status3xx,
  status4xx,
  status5xx,
}: {
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
}) {
  const total = (status2xx + status3xx + status4xx + status5xx) || 1;
  const p2 = Math.round((status2xx / total) * 100);
  const p3 = Math.round((status3xx / total) * 100);
  const p4 = Math.round((status4xx / total) * 100);
  const p5 = Math.max(0, 100 - p2 - p3 - p4);

  return (
    <div className="w-full">
      <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden gap-0.5">
        <div style={{ width: `${p2}%` }} className="bg-emerald-500 rounded-l-full transition-all" title={`2xx Success: ${status2xx} (${p2}%)`} />
        <div style={{ width: `${p3}%` }} className="bg-sky-500 transition-all" title={`3xx Redirect: ${status3xx} (${p3}%)`} />
        <div style={{ width: `${p4}%` }} className="bg-amber-500 transition-all" title={`4xx Client Error: ${status4xx} (${p4}%)`} />
        <div style={{ width: `${p5}%` }} className="bg-rose-500 rounded-r-full transition-all" title={`5xx Server Error: ${status5xx} (${p5}%)`} />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
          <span className="block text-xs font-semibold text-emerald-700">2xx</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{status2xx.toLocaleString()}</span>
        </div>
        <div className="bg-sky-50 border border-sky-100 p-2 rounded-lg">
          <span className="block text-xs font-semibold text-sky-700">3xx</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{status3xx.toLocaleString()}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg">
          <span className="block text-xs font-semibold text-amber-700">4xx</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{status4xx.toLocaleString()}</span>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg">
          <span className="block text-xs font-semibold text-rose-700">5xx</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{status5xx.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
