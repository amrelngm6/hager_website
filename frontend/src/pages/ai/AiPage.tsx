import { useState } from 'react';
import {
  BarChart3,
  Bot,
  Cpu,
  Settings2,
  Sparkles,
  Terminal,
} from 'lucide-react';

import ChatTab from './components/ChatTab';
import ModelsTab from './components/ModelsTab';
import SettingsTab from './components/SettingTab';
import ServerTab from './components/ServerTab';
import ReportsTab from './components/ReportsTab';

type Tab = 'chat' | 'reports' | 'models' | 'settings' | 'server';

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'AI Assistant', icon: <Bot size={14} /> },
    { id: 'reports', label: 'Data Analysis', icon: <BarChart3 size={14} /> },
    { id: 'models', label: 'LLM Models', icon: <Cpu size={14} /> },
    { id: 'settings', label: 'AI Settings', icon: <Settings2 size={14} /> },
    { id: 'server', label: 'Ollama Server', icon: <Terminal size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={22} className="text-indigo-600" />
            AI & Intelligence Center
          </h1>
          <p className=" text-slate-500 mt-0.5">
            Self-hosted local LLMs powered by Ollama, server context inspection, and AI chat assistant.
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`ai-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg  font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'reports' && <ReportsTab />}
      {activeTab === 'models' && <ModelsTab />}
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'server' && <ServerTab />}
    </div>
  );
}

export default AiPage;