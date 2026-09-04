// Renders the payload produced by the `generate_report_chart` AI tool as an
// actual chart (bar / line / area / pie / table).
import { AreaChart, BarChart } from '../../analytics/components/AnalyticsCharts';
import type { ReportChartResult } from '../../../types';

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function PieChart({ data, size = 160 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2;
  let cumulative = 0;

  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI;
    const x1 = radius + radius * Math.sin(startAngle);
    const y1 = radius - radius * Math.cos(startAngle);
    const x2 = radius + radius * Math.sin(endAngle);
    const y2 = radius - radius * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = data.length === 1
      ? `M ${radius} 0 A ${radius} ${radius} 0 1 1 ${radius - 0.01} 0 Z`
      : `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: PIE_COLORS[i % PIE_COLORS.length], label: d.label, value: d.value, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1">
            <title>{`${s.label}: ${s.value.toLocaleString()} (${s.pct}%)`}</title>
          </path>
        ))}
      </svg>
      <div className="space-y-1.5 text-xs min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600 truncate max-w-[160px]">{s.label}</span>
            <span className="ml-auto font-mono text-slate-800 pl-3 whitespace-nowrap">
              {s.value.toLocaleString()} ({s.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-slate-600">Label</th>
            <th className="text-right px-3 py-2 font-semibold text-slate-600">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((d, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-3 py-1.5 text-slate-700">{d.label}</td>
              <td className="px-3 py-1.5 text-right font-mono text-slate-800">{d.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportChart({ chart }: { chart: ReportChartResult }) {
  const data = (chart.series ?? []).map((s) => ({ label: s.label, value: Number(s.value) || 0 }));

  return (
    <div className="not-prose">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-slate-800 font-sans">{chart.title}</h4>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 font-sans">{chart.chart_type} chart</span>
      </div>

      {data.length === 0 ? (
        <p className="text-slate-400 font-sans">No data returned.</p>
      ) : chart.chart_type === 'bar' ? (
        <BarChart data={data} color="#6366f1" />
      ) : chart.chart_type === 'line' || chart.chart_type === 'area' ? (
        <AreaChart data={data} color="#6366f1" />
      ) : chart.chart_type === 'pie' ? (
        <PieChart data={data} />
      ) : (
        <DataTable data={data} />
      )}

      {(chart.x_label || chart.y_label) && (
        <p className="text-[10px] text-slate-400 mt-2 font-sans">
          {chart.x_label && <>X: {chart.x_label}</>}
          {chart.x_label && chart.y_label && '  •  '}
          {chart.y_label && <>Y: {chart.y_label}</>}
        </p>
      )}
    </div>
  );
}

export default ReportChart;
