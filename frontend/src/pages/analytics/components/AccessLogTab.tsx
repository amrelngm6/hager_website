import { useState, useEffect } from 'react';
import type { AccessLogAnalyticsResponse, AccessLogEntry } from '../../../types/analytics';
import { Card, CardContent } from './../../../components/ui';
import { Search, Play, Pause, Filter, Eye, X, Terminal, Globe, Clock, ArrowUpDown } from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  let cls = 'bg-slate-100 text-slate-600 border-slate-200';
  if (status >= 200 && status < 300) cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  else if (status < 400) cls = 'bg-sky-50 text-sky-700 border-sky-200';
  else if (status < 500) cls = 'bg-amber-50 text-amber-700 border-amber-200';
  else cls = 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${cls}`}>
      {status}
    </span>
  );
}

// ─── Method Badge ─────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET:    'bg-indigo-50 text-indigo-700 border-indigo-200',
    POST:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    PUT:    'bg-amber-50 text-amber-700 border-amber-200',
    PATCH:  'bg-orange-50 text-orange-700 border-orange-200',
    DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
    HEAD:   'bg-slate-100 text-slate-600 border-slate-200',
    OPTIONS:'bg-purple-50 text-purple-700 border-purple-200',
  };
  const cls = colorMap[method.toUpperCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${cls}`}>
      {method}
    </span>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtBytes(b: number): string {
  if (b === 0) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function AccessLogDetailModal({ entry, onClose }: { entry: AccessLogEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Access Log Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Key fields grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Timestamp', value: new Date(entry.timestamp).toLocaleString() },
              { label: 'Domain', value: entry.domain || '—' },
              { label: 'Client IP', value: entry.ip },
              { label: 'Method', value: entry.method },
              { label: 'Status', value: String(entry.status) },
              { label: 'Response Size', value: fmtBytes(entry.bytes) },
              { label: 'Response Time', value: fmtMs(entry.requestTimeMs) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">{label}</p>
                <p className="text-sm font-medium text-slate-800 break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Path */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Request Path</p>
            <code className="block bg-slate-900 text-emerald-400 rounded-lg px-4 py-2.5 text-xs font-mono break-all">
              {entry.path}
            </code>
          </div>

          {/* User Agent */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">User Agent</p>
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 break-all">{entry.userAgent || '—'}</p>
          </div>

          {/* Raw log line */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Raw Log Line</p>
            <pre className="bg-slate-900 text-slate-300 rounded-lg px-4 py-3 text-[11px] font-mono whitespace-pre-wrap break-all overflow-x-auto">
              {entry.raw}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const STATUS_GROUPS = ['ALL', '2xx', '3xx', '4xx', '5xx'];

export function AccessLogTab({
  data,
  onRefresh,
}: {
  data: AccessLogAnalyticsResponse | null;
  onRefresh?: () => void;
}) {
  const [methodFilter, setMethodFilter]       = useState<string>('ALL');
  const [statusFilter, setStatusFilter]       = useState<string>('ALL');
  const [search, setSearch]                   = useState('');
  const [isLiveTail, setIsLiveTail]           = useState(true);
  const [selectedEntry, setSelectedEntry]     = useState<AccessLogEntry | null>(null);
  const [sortNewest, setSortNewest]           = useState(true);

  // Live-tail polling — same interval as ErrorTracingTab
  useEffect(() => {
    if (!isLiveTail || !onRefresh) return;
    const timer = setInterval(() => { onRefresh(); }, 4000);
    return () => clearInterval(timer);
  }, [isLiveTail, onRefresh]);

  if (!data) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Initializing access log stream…
      </div>
    );
  }

  // Client-side filters (server already filtered by method/statusGroup/search for the 500-row cap,
  // but we apply them again so interactive changes in the dropdown feel instant without a round-trip)
  const filteredEntries = data.entries
    .filter((e) => {
      if (methodFilter !== 'ALL' && e.method.toUpperCase() !== methodFilter) return false;
      if (statusFilter !== 'ALL') {
        const groupMap: Record<string, [number, number]> = {
          '2xx': [200, 299], '3xx': [300, 399], '4xx': [400, 499], '5xx': [500, 599],
        };
        const range = groupMap[statusFilter];
        if (range && (e.status < range[0] || e.status > range[1])) return false;
      }
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        return (
          e.ip.includes(q) ||
          e.path.toLowerCase().includes(q) ||
          e.userAgent.toLowerCase().includes(q) ||
          (e.domain && e.domain.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortNewest ? diff : -diff;
    });

  const { statusDistribution: sd } = data;

  const summaryCards = [
    {
      label: 'Total Requests',
      value: data.totalRequests,
      filter: 'ALL',
      color: 'text-slate-900',
      active: 'border-slate-400',
      bg: '',
    },
    {
      label: '2xx Success',
      value: sd.status2xx,
      filter: '2xx',
      color: 'text-emerald-700',
      active: 'border-emerald-500',
      bg: 'bg-emerald-50/50',
    },
    {
      label: '3xx Redirect',
      value: sd.status3xx,
      filter: '3xx',
      color: 'text-sky-700',
      active: 'border-sky-500',
      bg: 'bg-sky-50/50',
    },
    {
      label: '4xx Client Err',
      value: sd.status4xx,
      filter: '4xx',
      color: 'text-amber-700',
      active: 'border-amber-500',
      bg: 'bg-amber-50/50',
    },
    {
      label: '5xx Server Err',
      value: sd.status5xx,
      filter: '5xx',
      color: 'text-rose-700',
      active: 'border-rose-500',
      bg: 'bg-rose-50/50',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map((card) => (
          <button
            key={card.filter}
            onClick={() => setStatusFilter(card.filter)}
            className={`bg-white border-2 rounded-xl p-3 text-left transition-all shadow-sm hover:shadow-md ${card.bg} ${
              statusFilter === card.filter ? card.active : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase">{card.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* Control Bar */}
      <Card>
        <CardContent className="py-3 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search IP, path, user agent, domain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
            />
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>{m === 'ALL' ? 'All Methods' : m}</option>
              ))}
            </select>
          </div>

          {/* Status Group Filter */}
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {STATUS_GROUPS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : `${s} only`}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortNewest((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all flex-shrink-0"
            title="Toggle sort order"
          >
            <ArrowUpDown size={13} />
            {sortNewest ? 'Newest first' : 'Oldest first'}
          </button>

          {/* Live Tail Toggle */}
          <button
            onClick={() => setIsLiveTail(!isLiveTail)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border flex-shrink-0 ${
              isLiveTail
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-800'
            }`}
          >
            {isLiveTail ? <Pause size={13} /> : <Play size={13} />}
            {isLiveTail ? 'Live (pausing…)' : 'Paused'}
          </button>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Time
                  </span>
                </th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4">Path</th>
                <th className="py-3 px-4 text-right">Size</th>
                <th className="py-3 px-4 text-right">Resp. Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No log entries match the active filters
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-2.5 px-4">
                      <MethodBadge method={entry.method} />
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      <p>{new Date(entry.timestamp).toLocaleDateString()}</p>
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600 font-medium">
                      {entry.domain || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-indigo-600 font-semibold">
                      {entry.ip}
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <span
                        className="text-xs text-slate-700 font-medium truncate block"
                        title={entry.path}
                      >
                        {entry.path.length > 60 ? entry.path.slice(0, 60) + '…' : entry.path}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-500">
                      {fmtBytes(entry.bytes)}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono text-xs ${
                      entry.requestTimeMs !== null && entry.requestTimeMs > 1000
                        ? 'text-amber-600 font-semibold'
                        : 'text-slate-500'
                    }`}>
                      {fmtMs(entry.requestTimeMs)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-600 rounded border border-slate-200 text-xs font-medium transition-colors shadow-sm"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredEntries.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Showing <span className="font-semibold text-slate-600">{filteredEntries.length.toLocaleString()}</span> of{' '}
              <span className="font-semibold text-slate-600">{data.totalRequests.toLocaleString()}</span> total requests
            </span>
            <span className="font-mono">
              {data.domainName && <span className="text-indigo-500">{data.domainName}</span>} · {data.timeRange}
            </span>
          </div>
        )}
      </Card>

      {selectedEntry && (
        <AccessLogDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
