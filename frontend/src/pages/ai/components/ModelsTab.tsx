import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Cpu,
  Download,
  HardDrive,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Modal,
  StatCard,
  Table,
} from '../../../components/ui';
import { aiApi } from '../../../api/ai.api';
import { useAuthStore } from '../../../store/auth.store';
import type {
  OllamaModel,
  OllamaPullProgress,
} from '../../../types';

const RECOMMENDED_MODELS = [
  { name: 'llama3.2', desc: 'Meta 3B model, fast & smart for general tasks', size: '2.0 GB' },
  { name: 'llama3.2:1b', desc: 'Lightweight Meta 1B model, minimal RAM footprint', size: '1.3 GB' },
  { name: 'deepseek-r1:1.5b', desc: 'DeepSeek reasoning & logic model', size: '1.1 GB' },
  { name: 'codellama', desc: 'Specialized model for code generation & debugging', size: '3.8 GB' },
  { name: 'mistral', desc: 'High quality 7B general reasoning model', size: '4.1 GB' },
  { name: 'phi3', desc: 'Microsoft efficient 3.8B model', size: '2.3 GB' },
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


// ─── Tab: LLM Management ─────────────────────────────────────────────────────

function ModelsTab() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [pullProgress, setPullProgress] = useState<OllamaPullProgress | null>(null);
  const [pullError, setPullError] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  const statusQuery = useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => aiApi.getStatus(),
  });

  const modelsQuery = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: () => aiApi.listModels(),
  });

  const runningQuery = useQuery({
    queryKey: ['ai', 'models-running'],
    queryFn: () => aiApi.getRunningModels(),
  });

  const status = statusQuery.data?.data;
  const models = modelsQuery.data?.data.models ?? [];
  const runningModels = runningQuery.data?.data.models ?? [];

  const deleteMutation = useMutation({
    mutationFn: (name: string) => aiApi.deleteModel(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'models'] });
      qc.invalidateQueries({ queryKey: ['ai', 'models-running'] });
    },
  });

  const handlePull = () => {
    if (!pullModelName.trim() || isPulling) return;
    setIsPulling(true);
    setPullError('');
    setPullProgress(null);

    aiApi.pullModelStream(
      pullModelName.trim(),
      (progress) => {
        setPullProgress(progress);
        if (progress.status === 'success') {
          setIsPulling(false);
          qc.invalidateQueries({ queryKey: ['ai', 'models'] });
        }
      },
      (err) => {
        setIsPulling(false);
        setPullError(err);
      }
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Model Name',
      render: (m: OllamaModel) => (
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-indigo-600 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-900 ">{m.name}</span>
            <p className="text-[10px] text-slate-400 font-mono">{m.digest.slice(0, 12)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Disk Size',
      render: (m: OllamaModel) => (
        <span className="font-mono  text-slate-700">{formatBytes(m.size)}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (m: OllamaModel) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="info">{m.details?.family || 'llama'}</Badge>
          <Badge variant="default">{m.details?.parameter_size || 'N/A'}</Badge>
          <Badge variant="default">{m.details?.quantization_level || 'Q4_0'}</Badge>
        </div>
      ),
    },
    {
      key: 'modified',
      header: 'Modified',
      render: (m: OllamaModel) => (
        <span className=" text-slate-500">
          {new Date(m.modified_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (m: OllamaModel) => (
        <div className="flex items-center justify-end">
          {isAdmin ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMutation.mutate(m.name)}
              loading={deleteMutation.isPending && deleteMutation.variables === m.name}
              title="Remove model file"
            >
              <Trash2 size={14} className="text-red-500" />
            </Button>
          ) : (
            <span className="text-[10px] text-slate-400">Admin only</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Downloaded LLMs"
          value={models.length}
          icon={<HardDrive size={20} />}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="Active in VRAM"
          value={runningModels.length}
          icon={<Zap size={20} />}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Ollama Service"
          value={status?.running ? 'Running' : 'Offline'}
          icon={<Bot size={20} />}
          color={status?.running ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}
        />
        <StatCard
          label="Hardware Acceleration"
          value={status?.gpu_available ? 'GPU Accelerated' : 'CPU Only'}
          icon={<Cpu size={20} />}
          color={status?.gpu_available ? 'bg-purple-50 text-purple-700' : 'bg-slate-50 text-slate-700'}
        />
      </div>

      {/* Model Inventory */}
      <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm">
        <CardHeader
          title="Ollama Local Model Library"
          description="Manage LLM binaries stored on your server."
          action={<Badge variant="info">{models.length} models</Badge>}
          btn={
            isAdmin ? (
              <Button onClick={() => setPullModalOpen(true)}>
                <Download size={14} /> Pull New LLM
              </Button>
            ) : undefined
          }
        />
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={models}
            keyExtractor={(m) => m.digest || m.name}
            loading={modelsQuery.isLoading}
            emptyText="No LLM models downloaded yet. Click 'Pull New LLM' to download one."
          />
        </CardContent>
      </Card>

      {/* Modal: Pull Model */}
      <Modal
        open={pullModalOpen}
        onClose={() => {
          if (!isPulling) {
            setPullModalOpen(false);
            setPullProgress(null);
            setPullError('');
          }
        }}
        title="Download / Pull LLM Model"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPullModalOpen(false)} disabled={isPulling}>
              Close
            </Button>
            <Button onClick={handlePull} loading={isPulling} disabled={!pullModelName.trim()}>
              Start Download
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className=" text-slate-500 leading-relaxed">
            Select a recommended open model or type any model tag from the{' '}
            <a
              href="https://ollama.com/library"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline font-medium"
            >
              Ollama Model Library
            </a>
            .
          </p>

          <Input
            label="Model Tag Name"
            placeholder="e.g. llama3.2, deepseek-r1:1.5b, mistral"
            value={pullModelName}
            onChange={(e) => setPullModelName(e.target.value)}
          />

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Popular Library Models:</span>
            <div className="grid grid-cols-2 gap-2">
              {RECOMMENDED_MODELS.map((rec) => (
                <button
                  key={rec.name}
                  type="button"
                  onClick={() => setPullModelName(rec.name)}
                  className={`p-2.5 text-left border rounded-xl transition-all  ${
                    pullModelName === rec.name
                      ? 'border-indigo-600 bg-indigo-50/50 font-semibold'
                      : 'border-slate-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900 font-mono text-[11px]">{rec.name}</span>
                    <span className="text-[10px] text-slate-400">{rec.size}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{rec.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pull Progress indicator */}
          {pullProgress && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between  font-semibold text-slate-700">
                <span>Status: {pullProgress.status}</span>
                {pullProgress.total && pullProgress.completed && (
                  <span>
                    {Math.round((pullProgress.completed / pullProgress.total) * 100)}%
                  </span>
                )}
              </div>
              {pullProgress.total && pullProgress.completed && (
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 transition-all duration-300"
                    style={{
                      width: `${(pullProgress.completed / pullProgress.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {pullError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl  text-red-600">
              ❌ {pullError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ModelsTab;