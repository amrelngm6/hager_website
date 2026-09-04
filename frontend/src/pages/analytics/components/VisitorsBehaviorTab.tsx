import type { VisitorAnalyticsResponse } from '../../../types/analytics';
import { AreaChart, StatusDistributionBar } from './AnalyticsCharts';
import { Card, CardContent, CardHeader, StatCard } from '../../../components/ui';
import { Users, Activity, HardDrive, Clock, Globe, ShieldAlert } from 'lucide-react';

export function VisitorsBehaviorTab({ data }: { data: VisitorAnalyticsResponse | null }) {
  if (!data) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Loading visitor analytics…
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const chartPoints = data.trafficTimeSeries.map((pt) => ({
    label: pt.timestamp,
    value: pt.requests,
  }));

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Requests"
          value={data.totalRequests.toLocaleString()}
          icon={<Activity size={20} />}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="Unique Visitors"
          value={data.uniqueVisitors.toLocaleString()}
          icon={<Users size={20} />}
          color="bg-sky-50 text-sky-700"
        />
        <StatCard
          label="Total Bandwidth"
          value={formatBytes(data.totalBandwidthBytes)}
          icon={<HardDrive size={20} />}
          color="bg-violet-50 text-violet-700"
        />
        <StatCard
          label="Avg Response"
          value={`${data.avgResponseTimeMs} ms`}
          icon={<Clock size={20} />}
          color="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* Traffic Chart + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Traffic Velocity"
            description={`HTTP requests over the selected timeframe (${data.timeRange})`}
            action={
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                Live
              </span>
            }
          />
          <CardContent>
            <AreaChart data={chartPoints} height={200} color="#6366f1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="HTTP Status Codes" description="Distribution of server responses" />
          <CardContent>
            <StatusDistributionBar {...data.statusDistribution} />
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 flex items-center justify-between">
              <span>Server uptime</span>
              <strong className="text-emerald-600 font-mono">99.98%</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints + Top IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="Top Endpoints"
            description="Most requested paths and their latency"
            action={<Globe size={16} className="text-slate-400" />}
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {data.topUrls.slice(0, 5).map((url, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium text-indigo-700 truncate">{url.path}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Avg {url.avgResponseMs} ms</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900 font-mono">{url.count.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{formatBytes(url.bandwidthBytes)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Top Visitor IPs"
            description="Highest-volume client addresses"
            action={<ShieldAlert size={16} className="text-slate-400" />}
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {data.topIps.map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600 font-mono">
                      {ip.country}
                    </span>
                    <span className="font-mono text-sm text-slate-800 font-medium">{ip.ip}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-700 font-mono">{ip.requests.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{formatBytes(ip.bandwidthBytes)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
