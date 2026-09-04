import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  FileCode,
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Modal,
} from '../../../components/ui';
import { aiApi } from '../../../api/ai.api';
import { filesApi, type FileEntry } from '../../../api/files.api';
import { parseMessageSegments, tryParseJson, JsonTree, ToolCallBlock } from './shared/aiMessage';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ─── Tab: AI Chat ────────────────────────────────────────────────────────────

export function ChatTab() {
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [fileRefInput, setFileRefInput] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedModelOverride, setSelectedModelOverride] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog state
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    conversationId: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    message: string;
  } | null>(null);

  // File mention autocomplete state
  const [mentionPath, setMentionPath] = useState<{ dir: string; query: string; matchStart: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // stays true until user scrolls up; resets to true on each send
  const isAtBottomRef = useRef(true);

  // Queries
  const convsQuery = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: () => aiApi.listConversations(),
  });

  const activeConvQuery = useQuery({
    queryKey: ['ai', 'conversation', activeConvId],
    queryFn: () => aiApi.getConversation(activeConvId!),
    enabled: !!activeConvId,
  });

  const modelsQuery = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: () => aiApi.listModels(),
  });

  const settingsQuery = useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: () => aiApi.getSettings(),
  });

  // Query for file autocomplete suggestions based on current directory
  const fileSuggestionsQuery = useQuery({
    queryKey: ['files', 'autocomplete', mentionPath?.dir ?? '/'],
    queryFn: () => filesApi.list(mentionPath?.dir ?? '/'),
    enabled: mentionPath !== null,
    staleTime: 10000,
  });

  // Modal file browser query
  const modalFilesQuery = useQuery({
    queryKey: ['files', 'modal-browser', fileRefInput],
    queryFn: () => {
      const lastSlash = fileRefInput.lastIndexOf('/');
      const dir = lastSlash !== -1 ? fileRefInput.slice(0, lastSlash) : '/';
      return filesApi.list(dir);
    },
    enabled: showFileModal,
    staleTime: 5000,
  });

  const conversations = convsQuery.data?.data.conversations ?? [];
  const activeMessages = activeConvQuery.data?.data.messages ?? [];
  const models = modelsQuery.data?.data.models ?? [];
  const settings = settingsQuery.data?.data;

  // Filter autocomplete suggestions
  const rawEntries = fileSuggestionsQuery.data?.data.entries ?? [];
  const suggestions = mentionPath
    ? rawEntries.filter((e) =>
        e.name.toLowerCase().includes(mentionPath.query.toLowerCase())
      )
    : [];

  // Filter modal suggestions
  const modalEntries = modalFilesQuery.data?.data.entries ?? [];
  const modalLastSlash = fileRefInput.lastIndexOf('/');
  const modalQuery = modalLastSlash !== -1 ? fileRefInput.slice(modalLastSlash + 1) : fileRefInput;
  const filteredModalEntries = modalEntries.filter((e) =>
    e.name.toLowerCase().includes(modalQuery.toLowerCase())
  );

  // Auto-scroll to bottom of messages
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [activeMessages, streamedResponse, isStreaming]);
  // useEffect(() => {
  //   const container = scrollContainerRef.current;
  //   if (!container) return;
  //   const { scrollTop, scrollHeight, clientHeight } = container;
  //   const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
  //   if (isNearBottom) {
  //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [activeMessages, streamedResponse, isStreaming]);

  // Mutations
  const deleteConvMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      if (activeConvId === id) setActiveConvId(null);
    },
  });

  // Handle autocomplete selection
  const selectSuggestion = (entry: FileEntry) => {
    if (!mentionPath) return;

    const isDir = entry.type === 'directory';
    const cleanPath = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
    const formattedRef = isDir
      ? `@file:${cleanPath}/`
      : cleanPath.includes(' ')
      ? `@file:"${cleanPath}"`
      : `@file:${cleanPath}`;

    const val = inputMessage;
    const cursor = textareaRef.current?.selectionStart ?? val.length;
    const before = val.slice(0, mentionPath.matchStart);
    const after = val.slice(cursor);

    const newText = `${before}${formattedRef}${isDir ? '' : ' '}${after}`;
    setInputMessage(newText);

    if (isDir) {
      // Re-trigger directory search inside selected folder
      setMentionPath({ dir: cleanPath, query: '', matchStart: before.length });
      setSelectedIndex(0);
    } else {
      setMentionPath(null);
    }

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // Handle textarea text change & detect mention query
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputMessage(val);
    setErrorMessage(null);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);

    // Detect mention trigger at end of textBeforeCursor
    const match = textBeforeCursor.match(/(?:^|\s)@(?:file:)?(?:"([^"]*)"|([^\s]*))$/);

    if (match) {
      const matchText = match[0];
      const typedPath = match[1] ?? match[2] ?? '';
      const matchStart = cursor - matchText.trimStart().length;

      const lastSlash = typedPath.lastIndexOf('/');
      let dir = '';
      let query = typedPath;
      if (lastSlash !== -1) {
        dir = typedPath.slice(0, lastSlash);
        query = typedPath.slice(lastSlash + 1);
      }

      setMentionPath({ dir, query, matchStart });
      setSelectedIndex(0);
    } else {
      setMentionPath(null);
    }
  };

  // Handle key navigation inside textarea for mention autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionPath && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionPath(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle message send
  const handleSend = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userText = inputMessage.trim();
    setErrorMessage(null);
    setMentionPath(null);
    setInputMessage('');
    setIsStreaming(true);
    setStreamedResponse('');
    isAtBottomRef.current = true; // snap back to bottom on new send

    const modelToUse = selectedModelOverride || settings?.default_model || 'llama3.2';

    try {
      await aiApi.sendChatMessageStream(
        {
          message: userText,
          conversation_id: activeConvId ?? undefined,
          model: modelToUse,
        },
        (chunk) => {
          if (chunk.type === 'delta') {
            setStreamedResponse((prev) => prev + chunk.content);
          } else if (chunk.type === 'confirmation_request') {
            // Pause streaming and show UI dialog instead of asking user to type "yes"
            setIsStreaming(false);
            setStreamedResponse('');
            setPendingConfirmation({
              conversationId: chunk.conversation_id!,
              toolName: chunk.toolName ?? '',
              toolArgs: chunk.toolArgs ?? {},
              message: chunk.confirmationMessage ?? chunk.content,
            });
            if (chunk.conversation_id && chunk.conversation_id !== activeConvId) {
              setActiveConvId(chunk.conversation_id);
            }
            qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
            qc.invalidateQueries({ queryKey: ['ai', 'conversation', chunk.conversation_id] });
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
            setInputMessage(userText); // Restore input prompt text on error!
            qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
            if (chunk.conversation_id) {
              qc.invalidateQueries({ queryKey: ['ai', 'conversation', chunk.conversation_id] });
            }
          }
        }
      );
    } catch (err: any) {
      setIsStreaming(false);
      setStreamedResponse('');
      setErrorMessage(`Failed to communicate with AI model: ${err.message}`);
      setInputMessage(userText); // Restore input prompt text!
    }
  };

  const handleInsertFileRef = () => {
    if (!fileRefInput.trim()) return;
    const refTag = `@file:${fileRefInput.trim()}`;
    setInputMessage((prev) => (prev ? `${prev} ${refTag}` : refTag));
    setFileRefInput('');
    setShowFileModal(false);
  };

  const handleConfirm = async () => {
    if (!pendingConfirmation) return;
    const { conversationId } = pendingConfirmation;
    setPendingConfirmation(null);
    setIsStreaming(true);
    setStreamedResponse('');

    try {
      await aiApi.confirmActionStream(conversationId, (chunk) => {
        if (chunk.type === 'delta') {
          setStreamedResponse((prev) => prev + chunk.content);
        } else if (chunk.type === 'done') {
          setIsStreaming(false);
          setStreamedResponse('');
          qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
          qc.invalidateQueries({ queryKey: ['ai', 'conversation', conversationId] });
        } else if (chunk.type === 'error') {
          setIsStreaming(false);
          setStreamedResponse('');
          setErrorMessage(chunk.content);
          qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
          qc.invalidateQueries({ queryKey: ['ai', 'conversation', conversationId] });
        }
      });
    } catch (err: any) {
      setIsStreaming(false);
      setStreamedResponse('');
      setErrorMessage(`Confirmation failed: ${err.message}`);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingConfirmation(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-[720px]">
      {/* Sidebar: Conversations */}
      <Card className="flex flex-col overflow-hidden border-slate-200 bg-white/95">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-800 flex items-center gap-2 ">
            <MessageSquare size={16} className="text-indigo-600" /> History
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveConvId(null);
              setStreamedResponse('');
              setErrorMessage(null);
            }}
            title="Start new conversation"
          >
            <Plus size={14} /> New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convsQuery.isLoading ? (
            <div className="p-4 text-center text-slate-400 ">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400  leading-relaxed">
              No conversations yet. Type a question on the right to start!
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
                className={`group flex items-center justify-between px-3 py-2 rounded-xl  font-medium cursor-pointer transition-all ${
                  activeConvId === c.id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <p className="truncate">{c.title}</p>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(c.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConvMutation.mutate(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex flex-col overflow-hidden border-slate-200 bg-white/95 relative">
        {/* Header bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 ">
                {activeConvQuery.data?.data.conversation.title || 'New AI Assistant Chat'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {settings?.provider === 'ollama'
                  ? `Local LLM (${settings.ollama_host})`
                  : `Cloud Provider (${settings?.provider})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModelOverride || settings?.default_model || ''}
              onChange={(e) => setSelectedModelOverride(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg  px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({formatBytes(m.size)})
                  </option>
                ))
              ) : (
                <option value={settings?.default_model || 'llama3.2'}>
                  {settings?.default_model || 'llama3.2'}
                </option>
              )}
            </select>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowFileModal(true)}
              title="Attach File Reference"
            >
              <FileCode size={14} /> Mention File
            </Button>
          </div>
        </div>

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={() => {
            const el = scrollContainerRef.current;
            if (!el) return;
            isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
          }}
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 w-full"
        >
          {activeMessages.length === 0 && !isStreaming && !streamedResponse && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  How can I help you manage your server today?
                </h3>
                <p className=" text-slate-500 max-w-md mt-1 leading-relaxed">
                  Ask questions about server configuration, Nginx logs, PHP setups, MySQL databases, or write code scripts. Type <code className="bg-slate-100 px-1 rounded font-mono text-indigo-600">@file:filename</code> to inspect files with autocomplete!
                </p>
              </div>

              {/* Sample prompts */}
              <div className="grid gap-2 sm:grid-cols-2 max-w-lg w-full text-left">
                {[
                  'How do I optimize MySQL pool size?',
                  'Check @file:public_html/index.php for syntax issues',
                  'Explain error codes in PHP-FPM log',
                  'Write a script to backup public_html',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(prompt)}
                    className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl  text-slate-600 hover:text-indigo-600 transition-all font-medium text-left shadow-sm"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Active Conversation Messages */}
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white ${
                  msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'
                }`}
              >
                {msg.role === 'user' ? 'U' : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl leading-relaxed max-w-[78%] min-w-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none px-4 py-3'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none px-4 py-3'
                }`}
              >
                {/* File Reference Chips */}
                {msg.file_references && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {JSON.parse(msg.file_references).map((ref: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] border border-indigo-100"
                      >
                        <FileText size={10} /> {ref}
                      </span>
                    ))}
                  </div>
                )}

                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap font-sans text-white">{msg.content}</p>
                ) : (
                  <AssistantMessageContent content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {/* Streaming Response Bubble */}
          {isStreaming && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-white border border-slate-200 text-slate-800 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 max-w-[78%]">
                {streamedResponse ? (
                  <AssistantMessageContent content={streamedResponse} />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    Thinking…
                  </div>
                )}
                {streamedResponse && (
                  <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-1 align-middle rounded-sm" />
                )}
              </div>
            </div>
          )}

          {/* <div ref={messagesEndRef} /> */}
        </div>

        {/* Input Bar with File Mention Autocomplete */}
        <div className="p-3 border-t border-slate-200 bg-white relative">
          {/* Confirmation Dialog */}
          {pendingConfirmation && (
            <div className="mb-3 p-4 bg-amber-50 border border-amber-300 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <Zap size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900 text-sm mb-1">Action requires confirmation</p>
                  <p className="text-amber-800 text-xs mb-2">
                    Tool: <code className="bg-amber-100 px-1 rounded font-mono">{pendingConfirmation.toolName}</code>
                  </p>
                  <pre className="bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-700 overflow-x-auto font-mono whitespace-pre-wrap break-all max-h-36">
                    {JSON.stringify(pendingConfirmation.toolArgs, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button size="sm" variant="ghost" onClick={handleCancelConfirmation}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirm}>
                  <CheckCircle2 size={13} /> Confirm
                </Button>
              </div>
            </div>
          )}

          {/* Non-existent file error notification */}
          {errorMessage && (
            <div className="p-3 mb-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span><strong>Prompt Stopped:</strong> {errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-600 font-bold  leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Autocomplete Suggestions Popover */}
          {mentionPath && (
            <div className="absolute bottom-full mb-2 left-3 right-3 bg-white/95 backdrop-blur border border-indigo-200 rounded-2xl shadow-2xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100 font-sans">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>📁 Files in <code className="text-indigo-600">{mentionPath.dir || 'web root'}</code></span>
                <span className="text-[10px]">Use ↑↓ arrows, Enter to select</span>
              </div>
              {fileSuggestionsQuery.isLoading ? (
                <div className="p-3 text-center text-sm text-slate-400 animate-pulse">Loading directory entries...</div>
              ) : suggestions.length === 0 ? (
                <div className="p-3 text-center text-sm text-slate-400">No matching files or folders found</div>
              ) : (
                suggestions.map((entry, idx) => (
                  <button
                    key={entry.path}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(entry);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition-colors ${
                      idx === selectedIndex ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {entry.type === 'directory' ? (
                        <FolderOpen size={14} className="text-amber-500 flex-shrink-0" />
                      ) : (
                        <FileText size={14} className="text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 ml-2 flex-shrink-0">
                      {entry.type === 'directory' ? 'folder' : formatBytes(entry.size)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Ask AI... (Shift+Enter for newline, type @ or @file: for autocomplete)`}
              className="flex-1 border border-slate-200 rounded-xl p-2.5  text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
            />
            <Button
              onClick={handleSend}
              loading={isStreaming}
              disabled={!inputMessage.trim()}
              className="h-12 px-4 rounded-xl"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>
              Tip: Type <code className="bg-slate-100 px-1 rounded text-indigo-600 font-mono">@</code> to autocomplete file paths. Non-existent files will return an error and stop execution.
            </span>
          </p>
        </div>
      </Card>

      {/* Modal: Insert File Mention */}
      <Modal
        open={showFileModal}
        onClose={() => setShowFileModal(false)}
        title="Mention File in Context"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowFileModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertFileRef} disabled={!fileRefInput.trim()}>
              Insert Tag
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className=" text-slate-500 leading-relaxed">
            Select or enter a file path relative to your web root. The file content will be supplied as context to the LLM.
          </p>
          <Input
            label="File Path"
            placeholder="e.g. index.php or public_html/index.php"
            value={fileRefInput}
            onChange={(e) => setFileRefInput(e.target.value)}
          />

          {/* Quick file selector inside modal */}
          <div className="border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1 bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 block px-1">Available Files:</span>
            {modalFilesQuery.isLoading ? (
              <div className="text-sm text-slate-400 p-2">Loading files...</div>
            ) : filteredModalEntries.length === 0 ? (
              <div className="text-sm text-slate-400 p-2">No files match search</div>
            ) : (
              filteredModalEntries.map((e) => (
                <button
                  key={e.path}
                  type="button"
                  onClick={() => {
                    const cleanPath = e.path.startsWith('/') ? e.path.slice(1) : e.path;
                    if (e.type === 'directory') {
                      setFileRefInput(`${cleanPath}/`);
                    } else {
                      setFileRefInput(cleanPath);
                    }
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center justify-between hover:bg-white hover:shadow-sm text-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    {e.type === 'directory' ? (
                      <FolderOpen size={13} className="text-amber-500 flex-shrink-0" />
                    ) : (
                      <FileText size={13} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-mono truncate">{e.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {e.type === 'directory' ? 'folder' : formatBytes(e.size)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


/** Renders a full assistant message with tool call detection */
export function AssistantMessageContent({ content }: { content: string }) {
  const segments = parseMessageSegments(content);

  return (
    <div className="space-y-1">
      {segments.map((seg, i) => {
        if (seg.kind === 'tool') {
          return (
            <ToolCallBlock
              key={i}
              toolName={seg.toolName}
              result={seg.result}
              parsedResult={seg.parsedResult}
            />
          );
        }
        // Plain text — check if it contains inline JSON
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



export default ChatTab;