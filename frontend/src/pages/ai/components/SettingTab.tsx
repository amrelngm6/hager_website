import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Save,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '../../../components/ui';
import { aiApi } from '../../../api/ai.api';
import type {
  AiProvider,
  AiSettingsInput,
} from '../../../types';


// ─── Tab: Settings ───────────────────────────────────────────────────────────

function SettingsTab() {
  const qc = useQueryClient();

  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<AiSettingsInput>({
    provider: 'ollama',
    ollama_host: '',
    default_model: '',
    deepseek_api_key: '',
    openai_api_key: '',
    anthropic_api_key: '',
    temperature: 0.7,
    max_tokens: 512,
    system_prompt: '',
  });

  const settingsQuery = useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: () => aiApi.getSettings(),
  });
  

  // Sync form state when API data updates
  useEffect(() => {
    if (settingsQuery.data?.data) {
      setForm(settingsQuery.data.data);
    }
  }, [settingsQuery.data?.data]);

  const settings = settingsQuery.data?.data;

  useEffect(() => {
    if (settings) {
      setForm({
        provider: settings.provider,
        ollama_host: settings.ollama_host,
        default_model: settings.default_model,
        deepseek_api_key: settings.deepseek_api_key,
        openai_api_key: settings.openai_api_key,
        anthropic_api_key: settings.anthropic_api_key,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        system_prompt: settings.system_prompt,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: AiSettingsInput) => aiApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader
        title="AI Module Settings"
        description="Configure local Ollama instance or cloud AI provider integration."
      />
      <CardContent className="p-5 space-y-5">
        {settingsQuery.isLoading ? (
          <div className="p-8 text-center text-slate-400 ">Loading settings...</div>
        ) : (
          <>
            {/* Active Provider Selector */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { id: 'ollama', title: 'Local Ollama', desc: 'Self-hosted LLMs on server hardware (Free & Private)' },
                { id: 'openai', title: 'OpenAI API', desc: 'GPT-4o & GPT-4o-mini cloud models' },
                { id: 'deepseek', title: 'DeepSeek API', desc: 'DeepSeek cloud models' },
                { id: 'anthropic', title: 'Anthropic API', desc: 'Claude 3.5 Sonnet & Haiku models' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setForm((prev) => ({ ...prev, provider: p.id as AiProvider }))}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                    form.provider === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-indigo-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold  text-slate-900">{p.title}</span>
                    {form.provider === p.id && <CheckCircle2 size={16} className="text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Provider specific inputs */}
            {form.provider === 'ollama' && (
              <Input
                label="Ollama Host Endpoint"
                placeholder="http://localhost:11434"
                value={form.ollama_host ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, ollama_host: e.target.value }))}
                helperText="URL where Ollama REST API is listening"
              />
            )}

            {form.provider === 'openai' && (
              <Input
                label="OpenAI API Key"
                type="password"
                placeholder="sk-..."
                value={form.openai_api_key ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, openai_api_key: e.target.value }))}
              />
            )}

            {form.provider === 'anthropic' && (
              <Input
                label="Anthropic API Key"
                type="password"
                placeholder="sk-ant-..."
                value={form.anthropic_api_key ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, anthropic_api_key: e.target.value }))}
              />
            )}

            {form.provider === 'deepseek' && (
              <Input
                label="DeepSeek API Key"
                placeholder="sk-deepseek-..."
                value={form.deepseek_api_key ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, deepseek_api_key: e.target.value }))}
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Default Model Tag"
                placeholder="e.g. llama3.2 or gpt-4o-mini"
                value={form.default_model ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, default_model: e.target.value }))}
              />

              <Input
                label="Max Output Tokens"
                type="number"
                value={form.max_tokens ?? 4096}
                onChange={(e) => setForm((prev) => ({ ...prev, max_tokens: parseInt(e.target.value) || 4096 }))}
              />
            </div>

            {/* Temperature Slider */}
            <div>
              <label className="block  font-semibold text-slate-700 mb-1">
                Temperature (Creativity): {form.temperature ?? 0.7}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.temperature ?? 0.7}
                onChange={(e) => setForm((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.0 (Precise / Code)</span>
                <span>0.7 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block  font-semibold text-slate-700 mb-1">
                System Prompt Instructions
              </label>
              <textarea
                rows={4}
                value={form.system_prompt ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, system_prompt: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl p-3  text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Save bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {saved && (
                  <span className=" text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> AI Settings saved
                  </span>
                )}
              </div>
              <Button
                size="sm"
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate(form)}
              >
                <Save size={14} /> Save Configuration
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SettingsTab;