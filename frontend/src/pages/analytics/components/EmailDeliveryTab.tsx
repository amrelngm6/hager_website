import { useState } from 'react';
import type { EmailAnalyticsResponse, EmailLogEntry } from '../../../types/analytics';
import { AreaChart, ProgressRing } from './AnalyticsCharts';
import { Card, CardContent, CardHeader, StatCard} from '../../../components/ui';
import { Mail, CheckCircle2, AlertTriangle, XCircle, Search, ArrowRight, ShieldCheck } from 'lucide-react';

export function EmailDeliveryTab({ data }: { data: EmailAnalyticsResponse | null }) {
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);

  if (!data) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Loading email delivery analytics…
      </div>
    );
  }

  const timeSeriesPoints = data.timeSeries.map((t) => ({
    label: t.timestamp,
    value: t.delivered,
    secondaryValue: t.bounced + t.deferred,
  }));

  const filteredLogs = data.recentLogs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.sender.toLowerCase().includes(q) ||
      log.recipient.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q)
    );
  });

  // const statusVariant = (status: string) => {
  //   if (status === 'delivered') return 'success';
  //   if (status === 'bounced') return 'danger';
  //   return 'warning';
  // };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivery Rate</p>
            <h4 className="text-2xl font-bold text-emerald-600 font-mono mt-1">{data.successRate}%</h4>
            <p className="text-xs text-slate-400 mt-1">{data.delivered} of {data.totalSent}</p>
          </div>
          <ProgressRing percentage={data.successRate} size={64} strokeWidth={7} color="#10b981" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bounce Rate</p>
            <h4 className="text-2xl font-bold text-rose-600 font-mono mt-1">{data.bounceRate}%</h4>
            <p className="text-xs text-slate-400 mt-1">{data.bounced} bounced</p>
          </div>
          <ProgressRing percentage={data.bounceRate} size={64} strokeWidth={7} color="#f43f5e" />
        </div>

        <StatCard
          label="Deferred / Queued"
          value={data.deferred}
          icon={<AlertTriangle size={20} />}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Spam Flagged"
          value={data.spam}
          icon={<ShieldCheck size={20} />}
          color="bg-indigo-50 text-indigo-700"
        />
      </div>

      {/* Chart + Top Senders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Mail Delivery Velocity"
            description="Delivered (indigo) vs bounced/deferred (rose) over time"
          />
          <CardContent>
            <AreaChart data={timeSeriesPoints} height={200} color="#6366f1" secondaryColor="#f43f5e" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Top Senders" description="Highest-volume outbound addresses" />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {data.topSenders.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="font-mono text-sm text-slate-700 truncate max-w-[180px]">{s.email}</span>
                  <span className="text-sm font-bold text-slate-900 font-mono flex-shrink-0 ml-2">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Log Table */}
      <Card>
        <CardHeader
          title="Email Log Tracer"
          description="Click any row to inspect the full SMTP delivery trace"
          action={
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search sender, recipient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
              />
            </div>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Time</th>
                  <th className="py-3 px-5">Sender</th>
                  <th className="py-3 px-5">Recipient</th>
                  <th className="py-3 px-5">Subject</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">No results found</td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-5 font-mono text-slate-400 whitespace-nowrap text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-5 font-mono text-indigo-600 text-sm">{log.sender}</td>
                    <td className="py-3 px-5 font-mono text-slate-800 text-sm">{log.recipient}</td>
                    <td className="py-3 px-5 text-slate-600 truncate max-w-[200px]">{log.subject}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        log.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'bounced'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {log.status === 'delivered' && <CheckCircle2 size={11} />}
                        {log.status === 'bounced' && <XCircle size={11} />}
                        {log.status === 'deferred' && <AlertTriangle size={11} />}
                        <span className="capitalize">{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium inline-flex items-center gap-1">
                        View hops <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Trace Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="text-indigo-600" size={18} />
                  Delivery Transport Timeline
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">Sender</span>
                <strong className="text-indigo-600 font-mono">{selectedLog.sender}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">Recipient</span>
                <strong className="text-slate-900 font-mono">{selectedLog.recipient}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-xs uppercase font-semibold">Subject</span>
                <span className="text-slate-700">{selectedLog.subject}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">SMTP Hops</h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
                {selectedLog.hops.map((hop) => (
                  <div key={hop.step} className="flex items-start gap-4 relative pl-8">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow">
                      {hop.step}
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-indigo-700 uppercase font-mono">{hop.stage}</span>
                        <span className="text-slate-400 font-mono">{new Date(hop.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{hop.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">Server: {hop.server}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
