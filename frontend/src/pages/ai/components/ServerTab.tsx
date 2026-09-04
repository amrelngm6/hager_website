import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Terminal,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '../../../components/ui';
import { aiApi } from '../../../api/ai.api';

// ─── Tab: Server & Installer ──────────────────────────────────────────────────

function ServerTab() {

  const [installerOutput, setInstallerOutput] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => aiApi.getStatus(),
  });

  const status = statusQuery.data?.data;


  return (
    <div className="space-y-6">
      {/* Diagnostics Card */}
      <Card className="border-slate-200 bg-white/95">
        <CardHeader
          title="Ollama System Diagnostics"
          description="Check server daemon status and automated installation scripts."
        />
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">Binary Installed</span>
              <p className="font-semibold  text-slate-800 mt-0.5 flex items-center gap-1">
                {status?.installed ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Installed
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <XCircle size={13} /> Not Installed
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">Daemon Status</span>
              <p className="font-semibold  text-slate-800 mt-0.5">
                {status?.running ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Active ({status.version})
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle size={13} /> Service Stopped
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">API Endpoint</span>
              <p className="font-mono  text-slate-700 truncate mt-0.5">
                {status?.host || 'http://localhost:11434'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">Installed Models</span>
              <p className="font-semibold  text-slate-800 mt-0.5">
                {status?.models_count || 0} models ready
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terminal Output Viewer */}
      {installerOutput && (
        <Card className="border-slate-200 bg-slate-900 text-white overflow-hidden shadow-lg">
          <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <span className="font-mono  text-slate-300 flex items-center gap-2">
              <Terminal size={14} className="text-indigo-400" /> Bash Script Output
            </span>
            <button
              onClick={() => setInstallerOutput(null)}
              className="text-slate-400 hover:text-white "
            >
              Close Output
            </button>
          </div>
          <CardContent className="p-4">
            <pre className=" font-mono leading-relaxed text-emerald-400 whitespace-pre-wrap overflow-x-auto max-h-[350px]">
              {installerOutput}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ServerTab;