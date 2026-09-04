import { useState, useEffect } from 'react';
import type { ErrorAnalyticsResponse, ErrorLogEntry, LogLevel } from '../../../types/analytics';
import { LogDetailsModal } from './LogDetailsModal';
import { Card, CardContent } from './../../../components/ui';
import { Search, Play, Pause, Filter, Eye } from 'lucide-react';

export function ErrorTracingTab({
  data,
  onRefresh,
}: {
  data: ErrorAnalyticsResponse | null;
  onRefresh?: () => void;
}) {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLiveTail, setIsLiveTail] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ErrorLogEntry | null>(null);

  useEffect(() => {
    if (!isLiveTail || !onRefresh) return;
    const timer = setInterval(() => { onRefresh(); }, 4000);
    return () => clearInterval(timer);
  }, [isLiveTail, onRefresh]);

  if (!data) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Initializing error log stream…
      </div>
    );
  }

  const filteredLogs = data.logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level.toUpperCase() !== levelFilter.toUpperCase()) return false;
    if (sourceFilter !== 'ALL' && log.source !== sourceFilter) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.domain && log.domain.toLowerCase().includes(q)) ||
        (log.clientIp && log.clientIp.includes(q)) ||
        (log.stackTrace && log.stackTrace.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getLevelStyle = (level: LogLevel) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ERROR':    return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'WARNING':  return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'INFO':     return 'bg-sky-50 text-sky-700 border-sky-100';
      default:         return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const severityCards = [
    { label: 'Total Events', value: data.totalErrors, filter: 'ALL', color: 'text-slate-900', active: 'border-slate-400' },
    { label: 'Critical', value: data.criticalCount, filter: 'CRITICAL', color: 'text-rose-700', active: 'border-rose-500' },
    { label: 'Errors', value: data.errorCount, filter: 'ERROR', color: 'text-rose-600', active: 'border-rose-400' },
    { label: 'Warnings', value: data.warningCount, filter: 'WARNING', color: 'text-amber-600', active: 'border-amber-500' },
    { label: 'Info', value: data.levelDistribution.INFO || 0, filter: 'INFO', color: 'text-sky-600', active: 'border-sky-500' },
  ];

  return (
    <div className="space-y-5">
      {/* Severity Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {severityCards.map((card) => (
          <button
            key={card.filter}
            onClick={() => setLevelFilter(card.filter)}
            className={`bg-white border-2 rounded-xl p-3 text-left transition-all shadow-sm hover:shadow-md ${
              levelFilter === card.filter ? card.active : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase">{card.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${card.color}`}>{card.value.toLocaleString()}</p>
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
              placeholder="Search messages, domains, IPs, stack traces…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
            />
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Sources</option>
              <option value="nginx_access">Nginx Access</option>
              <option value="nginx_error">Nginx Error</option>
              <option value="php_error">PHP Errors</option>
              <option value="syslog">Syslog</option>
              <option value="mail">Mail</option>
              <option value="cron">Cron</option>
            </select>
          </div>

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
                <th className="py-3 px-5">Level</th>
                <th className="py-3 px-5">Source</th>
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-5">Domain / IP</th>
                <th className="py-3 px-5">Source IP</th>
                <th className="py-3 px-5">Message</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No log events match the active filters
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getLevelStyle(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-bold text-indigo-600 ">{log.source}</td>
                  <td className="py-3 px-5 font-bold whitespace-nowrap ">
                    <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-3 px-5 font-bold ">
                    {log.domain || 'System'} 
                  </td>
                  <td className="py-3 px-5 font-bold ">
                    {log.clientIp || 'UNKNOWN'}
                  </td>
                  <td className="py-3 px-5 max-w-md">
                    <span className="font-bold text-xs " title={log.message}>{log.message.slice(0, 150)}</span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-600 rounded border border-slate-200 text-xs font-medium transition-colors shadow-sm"
                    >
                      <Eye size={12} /> Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedLog && (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
