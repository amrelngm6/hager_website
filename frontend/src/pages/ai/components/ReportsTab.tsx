// Data Analysis & Reports tab — lets the user ask natural-language questions
// about the application's data; the Ollama model inspects the schema, runs a
// read-only report query, and renders the result as a chart.
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  Bot,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { aiApi } from '../../../api/ai.api';
import type { ChatStreamChunk, ReportChartResult } from '../../../types';
import { parseMessageSegments, tryParseJson, JsonTree, ToolCallBlock } from './shared/aiMessage';
import { ReportChart } from './ReportChart';

// Conversations created from this tab are tagged with this title prefix so we
// can keep them separate from the general Chat history without a DB migration.
const REPORT_PREFIX = '\u{1F4CA} ';

const SAMPLE_PROMPTS = [
  'Show me a bar chart of domains created per month',
  'How many FTP accounts does each user have?',
  'Chart the number of backups taken over the last 30 days',
  'What are the top 5 users by number of databases?',
];

function AssistantReportContent({ content }: { content: string }) {
  const segments = parseMessageSegments(content);

  return (
    <div className="space-y-1">
      {segments.map((seg, i) => {
        if (seg.kind === 'tool') {
          if (seg.toolName === 'generate_report_chart') {
            return (
              <ToolCallBlock
                key={i}
                toolName={seg.toolName}
                result={seg.result}
                parsedResult={seg.parsedResult}
                defaultOpen
                renderBody={(parsed) => {
                  const obj = parsed as { success?: boolean; data?: ReportChartResult; error?: string } | null;
                  if (!obj?.success || !obj.data) {
                    return (
                      <p className="text-red-600 font-sans">{obj?.error ?? 'Chart could not be rendered.'}</p>
                    );
                  }
                  return <ReportChart chart={obj.data} />;
                }}
              />
            );
          }
          return (
            <ToolCallBlock
              key={i}
              toolName={seg.toolName}
              result={seg.result}
              parsedResult={seg.parsedResult}
            />
          );
        }
        const parsed = tryParseJson(seg.content);
        if (parsed !== null) {
          return (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-700 overflow-x-auto">
              <JsonTree value={parsed} />
            </div>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed">
            {seg.content}
          </p>
        );
      })}
    </div>
  );
}

export function ReportsTab() {
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convsQuery = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: () => aiApi.listConversations(),
  });

  const activeConvQuery = useQuery({
    queryKey: ['ai', 'conversation', activeConvId],
    queryFn: () => aiApi.getConversation(activeConvId!),
    enabled: !!activeConvId,
  });

  const settingsQuery = useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: () => aiApi.getSettings(),
  });

  const conversations = (convsQuery.data?.data.conversations ?? []).filter((c) => c.title.startsWith(REPORT_PREFIX));
  const activeMessages = activeConvQuery.data?.data.messages ?? [];
  const settings = settingsQuery.data?.data;
  const isOllamaProvider = !settings || settings.provider === 'ollama';

  const deleteConvMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      if (activeConvId === id) setActiveConvId(null);
    },
  });

  const handleSend = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userText = inputMessage.trim();
    setErrorMessage(null);
    setInputMessage('');
    setIsStreaming(true);
    setStreamedResponse('');

    try {
      await aiApi.sendChatMessageStream(
        {
          message: userText,
          conversation_id: activeConvId ?? undefined,
          model: settings?.default_model,
          mode: 'analytics',
        },
        (chunk: ChatStreamChunk) => {
          if (chunk.type === 'delta') {
            setStreamedResponse((prev) => prev + chunk.content);
          } else if (chunk.type === 'done') {
            setIsStreaming(false);
            setStreamedResponse('');
            if (chunk.conversation_id && chunk.conversation_id !== activeConvId) {
              setActiveConvId(chunk.conversation_id);
            }
            qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
            qc.invalidateQueries({ queryKey: ['ai', 'conversation', chunk.conversation_id] });
          } else if (chunk.type === 'error') {
            setIsStreaming(false);
            setStreamedResponse('');
            setErrorMessage(chunk.content);
            setInputMessage(userText);
            qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
            if (chunk.conversation_id) {
              qc.invalidateQueries({ queryKey: ['ai', 'conversation', chunk.conversation_id] });
            }
          }
        },
      );
    } catch (err: any) {
      setIsStreaming(false);
      setStreamedResponse('');
      setErrorMessage(`Failed to communicate with AI model: ${err.message}`);
      setInputMessage(userText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-[720px]">
      {/* Sidebar: Conversations */}
      <Card className="flex flex-col overflow-hidden border-slate-200 bg-white/95">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-600" /> Reports
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveConvId(null);
              setStreamedResponse('');
              setErrorMessage(null);
            }}
            title="Start new analysis"
          >
            <Plus size={14} /> New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convsQuery.isLoading ? (
            <div className="p-4 text-center text-slate-400">Loading reports...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400 leading-relaxed">
              No reports yet. Ask a question about your data on the right to start!
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveConvId(c.id);
                  setStreamedResponse('');
                  setErrorMessage(null);
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl font-medium cursor-pointer transition-all ${
                  activeConvId === c.id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{c.title.replace(REPORT_PREFIX, '')}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConvMutation.mutate(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity flex-shrink-0"
                  title="Delete report"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Main Area */}
      <Card className="flex flex-col overflow-hidden border-slate-200 bg-white/95 relative">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Data Analysis & Reports</h3>
            <p className="text-[11px] text-slate-500">Ask questions in plain language — Ollama reads the schema, queries the data, and charts it.</p>
          </div>
        </div>

        {!isOllamaProvider && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            This feature requires the Ollama provider. Switch providers in AI Settings to use it.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 w-full">
          {activeMessages.length === 0 && !isStreaming && !streamedResponse && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Ask a question about your data</h3>
                <p className="text-slate-500 max-w-md mt-1 leading-relaxed">
                  The model will inspect the database schema, run a safe read-only query, and show the result as a chart.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 max-w-lg w-full text-left">
                {SAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(prompt)}
                    className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl text-slate-600 hover:text-indigo-600 transition-all font-medium text-left shadow-sm"
                  >
                    📊 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white ${
                  msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'
                }`}
              >
                {msg.role === 'user' ? 'U' : <Bot size={14} />}
              </div>
              <div
                className={`rounded-2xl leading-relaxed max-w-[85%] min-w-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none px-4 py-3'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none px-4 py-3'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap font-sans text-white">{msg.content}</p>
                ) : (
                  <AssistantReportContent content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-white border border-slate-200 text-slate-800 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                {streamedResponse ? (
                  <AssistantReportContent content={streamedResponse} />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    Analyzing…
                  </div>
                )}
                {streamedResponse && (
                  <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-1 align-middle rounded-sm" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white relative">
          {errorMessage && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span className="flex-1">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isOllamaProvider}
              placeholder="Ask about your data... (Shift+Enter for newline)"
              className="flex-1 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans disabled:bg-slate-50 disabled:text-slate-400"
            />
            <Button onClick={handleSend} disabled={!inputMessage.trim() || isStreaming || !isOllamaProvider}>
              <Send size={14} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ReportsTab;
