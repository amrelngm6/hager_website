import { useState } from 'react';
import type { ErrorLogEntry } from '../../../types/analytics';
import { AlertCircle, Copy, Check, Terminal, Globe, Server } from 'lucide-react';

export function LogDetailsModal({
  log,
  onClose,
}: {
  log: ErrorLogEntry;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const levelStyle =
    log.level === 'CRITICAL' || log.level === 'ERROR'
      ? 'bg-rose-50 text-rose-600 border-rose-200'
      : log.level === 'WARNING'
      ? 'bg-amber-50 text-amber-600 border-amber-200'
      : 'bg-sky-50 text-sky-600 border-sky-200';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${levelStyle}`}>
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-2 py-0.5 rounded border uppercase ${levelStyle}`}>
                  {log.level}
                </span>
                <span className="text-sm font-mono text-indigo-600">{log.source}</span>
              </div>
              <h3 className=" font-semibold text-slate-900 mt-0.5">Log Trace Breakdown</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200  font-medium text-slate-700 rounded-lg transition-colors border border-slate-200"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg  font-medium transition-colors border border-slate-200"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto space-y-4 p-6 flex-1 ">
          {/* Message */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-sm font-semibold text-slate-500 uppercase block mb-1.5">Log Message</span>
            <p className="text-slate-800 font-mono  leading-relaxed">{log.message}</p>
          </div>

          {/* Context Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
              <Server size={16} className="text-indigo-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Timestamp</span>
                <span className="text-slate-800 font-mono text-sm">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
              <Globe size={16} className="text-sky-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Domain / IP</span>
                <span className="text-slate-800 font-mono text-sm">{log.domain || log.clientIp || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
              <Terminal size={16} className="text-violet-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Source</span>
                <span className="text-slate-800 font-mono text-sm capitalize">{log.source}</span>
              </div>
            </div>
          </div>

          {/* Stack Trace */}
          {log.stackTrace && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <span className="text-sm font-semibold text-slate-400 block mb-2">Stack Trace</span>
              <pre className="text-indigo-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {log.stackTrace}
              </pre>
            </div>
          )}

          {/* Context JSON */}
          {log.contextJson && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <span className="text-sm font-semibold text-slate-400 block mb-2">Execution Context</span>
              <pre className="text-emerald-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(log.contextJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
