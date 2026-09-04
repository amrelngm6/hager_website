import { useState } from 'react';
import type { LogAnalyticsAlert, LogAnalyticsSettings } from '../../../types/analytics';
import { Card, CardContent, CardHeader, Button} from '../../../components/ui';
import { Bell, Settings, Plus, Trash2, CheckCircle2, Save } from 'lucide-react';

export function LogAlertsSettingsTab({
  alerts,
  settings,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
  onUpdateSettings,
}: {
  alerts: LogAnalyticsAlert[];
  settings: LogAnalyticsSettings | null;
  onCreateAlert: (rule: { metricType: string; thresholdValue: number; channel: string; target?: string }) => void;
  onToggleAlert: (id: string, isEnabled: boolean) => void;
  onDeleteAlert: (id: string) => void;
  onUpdateSettings: (settings: LogAnalyticsSettings) => void;
}) {
  const [metricType, setMetricType] = useState('error_5xx');
  const [thresholdValue, setThresholdValue] = useState(5.0);
  const [channel, setChannel] = useState('system_notification');
  const [target, setTarget] = useState('admin@example.com');

  const [retentionDays, setRetentionDays] = useState(settings?.retentionDays ?? 30);
  const [autoRotate, setAutoRotate] = useState(settings?.autoRotate ?? true);
  const [compressionEnabled, setCompressionEnabled] = useState(settings?.compressionEnabled ?? true);
  const [webLogPath, setWebLogPath] = useState(settings?.webLogPath ?? '/var/log/nginx/access.log');
  const [mailLogPath, setMailLogPath] = useState(settings?.mailLogPath ?? '/var/log/mail.log');
  const [errorLogPath, setErrorLogPath] = useState(settings?.errorLogPath ?? '/var/log/nginx/error.log');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAlert({ metricType, thresholdValue, channel, target });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ retentionDays, autoRotate, compressionEnabled, webLogPath, mailLogPath, errorLogPath });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Alert Rules */}
      <div className="space-y-5">
        {/* Create rule form */}
        <Card>
          <CardHeader
            title="Alert Rules"
            description="Trigger notifications when log metrics cross a threshold"
            action={<Bell size={16} className="text-amber-500" />}
          />
          <CardContent>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-indigo-700 uppercase">New threshold alert</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Metric</label>
                    <select
                      value={metricType}
                      onChange={(e) => setMetricType(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="error_5xx">HTTP 5xx Error Rate (%)</option>
                      <option value="disk_usage">Disk Capacity (%)</option>
                      <option value="email_bounce">Email Bounce Rate (%)</option>
                      <option value="bandwidth">Bandwidth Limit (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Threshold</label>
                    <input
                      type="number"
                      step="0.5"
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Channel</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="system_notification">System Dashboard</option>
                      <option value="email">Email</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Target</label>
                    <input
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="email or https://…"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full justify-center">
                  <Plus size={14} /> Add Alert Rule
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active Rules */}
        <Card>
          <CardHeader
            title={`Active Rules (${alerts.length})`}
            description="Toggle or remove existing alert thresholds"
          />
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No alert rules configured yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 uppercase font-mono">
                          {rule.metricType.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-semibold">
                          ≥ {rule.thresholdValue}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                        {rule.target || rule.channel}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      {/* Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.isEnabled}
                          onChange={(e) => onToggleAlert(rule.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                      </label>

                      <button
                        onClick={() => onDeleteAlert(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Retention Settings */}
      <div>
        <Card>
          <CardHeader
            title="Retention & Policy"
            description="Configure log lifecycle, rotation, and file paths"
            action={
              savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Saved
                </span>
              ) : <Settings size={16} className="text-slate-400" />
            }
          />
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Retention Window */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Retention window</label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value, 10))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (default)</option>
                  <option value={90}>90 days (extended)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 divide-y divide-slate-200">
                <label className="flex items-center justify-between pb-3 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">Auto log rotation</span>
                    <span className="text-xs text-slate-500">Rotate access and error logs daily at midnight</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">Gzip compression</span>
                    <span className="text-xs text-slate-500">Compress rotated log files — saves up to 80% disk</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={compressionEnabled}
                    onChange={(e) => setCompressionEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {/* Log Paths */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Log file paths</h4>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Web / Nginx access log</label>
                  <input
                    type="text"
                    value={webLogPath}
                    onChange={(e) => setWebLogPath(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-indigo-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Mail delivery log</label>
                  <input
                    type="text"
                    value={mailLogPath}
                    onChange={(e) => setMailLogPath(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-indigo-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Error log</label>
                  <input
                    type="text"
                    value={errorLogPath}
                    onChange={(e) => setErrorLogPath(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-indigo-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full justify-center">
                <Save size={14} /> Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
