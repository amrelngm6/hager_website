import type { DiskBandwidthAnalyticsResponse } from '../../../types/analytics';
import { ProgressRing, BarChart } from './AnalyticsCharts';
import { Card, CardContent, CardHeader } from '../../../components/ui';
import { HardDrive, Network, Folder, Database, Mail, FileText, Archive, AlertCircle } from 'lucide-react';

export function DiskBandwidthTab({ data }: { data: DiskBandwidthAnalyticsResponse | null }) {
  if (!data) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Calculating disk usage and bandwidth metrics…
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const getFolderIcon = (name: string) => {
    if (name.includes('Web')) return <Folder className="text-indigo-500" size={16} />;
    if (name.includes('MySQL')) return <Database className="text-emerald-600" size={16} />;
    if (name.includes('Email')) return <Mail className="text-violet-500" size={16} />;
    if (name.includes('Logs')) return <FileText className="text-amber-500" size={16} />;
    return <Archive className="text-rose-500" size={16} />;
  };

  const barData = data.bandwidth.dailyUsage.map((d) => ({
    label: d.date.split('-').slice(1).join('/'),
    value: Math.round(d.bytes / 1073741824),
  }));

  const diskColor = data.disk.percentageUsed > 85 ? '#f43f5e' : '#6366f1';
  const diskWarning = data.disk.percentageUsed > 85;

  return (
    <div className="space-y-5">
      {/* Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Disk */}
        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <HardDrive size={16} className="text-indigo-500" />
                System Disk
              </h3>
              <p className="text-xs text-slate-400 font-mono">Mount: <code className="text-indigo-600">/</code></p>
              <div className="mt-2 space-y-1">
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500">Used:</span>
                  <strong className={diskWarning ? 'text-rose-600' : 'text-slate-900'}>{formatBytes(data.disk.usedBytes)}</strong>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500">Free:</span>
                  <strong className="text-emerald-600">{formatBytes(data.disk.freeBytes)}</strong>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500">Total:</span>
                  <strong className="text-slate-500">{formatBytes(data.disk.totalBytes)}</strong>
                </div>
              </div>
              {diskWarning && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> Disk usage is critically high
                </p>
              )}
            </div>
            <ProgressRing
              percentage={data.disk.percentageUsed}
              size={100}
              strokeWidth={9}
              color={diskColor}
              label="Used"
            />
          </CardContent>
        </Card>

        {/* Bandwidth */}
        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Network size={16} className="text-sky-500" />
                Monthly Bandwidth
              </h3>
              <p className="text-xs text-slate-400">Limit: <strong className="text-slate-700">{data.bandwidth.monthlyLimitGb} GB / mo</strong></p>
              <div className="mt-2 space-y-1">
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500">Used:</span>
                  <strong className="text-sky-600">{data.bandwidth.usedGb} GB</strong>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500">Projected:</span>
                  <strong className="text-amber-600">{data.bandwidth.projectedMonthEndGb} GB</strong>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500">Status:</span>
                  <strong className="text-emerald-600">Within quota</strong>
                </div>
              </div>
            </div>
            <ProgressRing
              percentage={data.bandwidth.percentageUsed}
              size={100}
              strokeWidth={9}
              color="#0ea5e9"
              label="Used"
            />
          </CardContent>
        </Card>
      </div>

      {/* Breakdown + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Storage by folder */}
        <Card>
          <CardHeader
            title="Storage Breakdown"
            description="Top directories by size across websites, databases, and logs"
          />
          <CardContent>
            <div className="space-y-4">
              {data.disk.breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      {getFolderIcon(item.folder)}
                      <div>
                        <span className="font-semibold text-slate-800">{item.folder}</span>
                        <span className="text-xs text-slate-400 block font-mono">{item.path}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-900 font-bold">{formatBytes(item.sizeBytes)}</span>
                      <span className="text-xs text-slate-400 block">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily bandwidth chart */}
        <Card>
          <CardHeader
            title="Daily Bandwidth (GB)"
            description="Network egress & ingress over the last 14 days"
          />
          <CardContent>
            <BarChart data={barData} height={190} color="#0ea5e9" valueFormatter={(v) => `${v}GB`} />
            <div className="mt-4 pt-4 border-t border-slate-100 bg-sky-50 rounded-lg p-3 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-sky-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-sky-800 leading-relaxed">
                Bandwidth warnings trigger automatically when monthly egress reaches <strong>85%</strong> of your quota limit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
