// Shared message-segment parsing & rendering helpers used by both the general
// AI Chat tab and the Data Analysis & Reports tab.
import { useState, type ReactNode } from 'react';
import { CheckCircle2, Terminal, XCircle, Zap } from 'lucide-react';

// ─── Segment parsing ─────────────────────────────────────────────────────────

export type TextSegment = { kind: 'text'; content: string };
export type ToolSegment = {
  kind: 'tool';
  toolName: string;
  /** Raw JSON string only — no trailing prose */
  result: string;
  parsedResult: unknown | null;
};
export type MessageSegment = TextSegment | ToolSegment;

/**
 * Walks forward from the start of `str` (skipping leading whitespace) to find
 * where the outermost JSON object or array ends. Returns the index in the
 * original string just past the closing bracket, or -1 if no JSON is found.
 */
export function findJsonEnd(str: string): number {
  const offset = str.length - str.trimStart().length;
  const trimmed = str.trimStart();
  const first = trimmed[0];
  if (first !== '{' && first !== '[') return -1;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return offset + i + 1;
    }
  }
  return -1;
}

/**
 * Detects and parses tool call segments inside an AI message.
 * Format: [Tool: tool_name] → {raw JSON or text result}
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  // Matches "[Tool: name] → " — we grab everything after manually
  const re = /\[Tool:\s*([^\]]+)\]\s*→\s*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    // Text before this tool call
    if (match.index > cursor) {
      const text = content.slice(cursor, match.index).trim();
      if (text) segments.push({ kind: 'text', content: text });
    }

    const toolName = match[1].trim();
    const afterArrow = content.slice(re.lastIndex);

    // Find where the JSON ends
    const jsonEnd = findJsonEnd(afterArrow);

    let jsonRaw: string;
    let consumed: number; // how many chars of afterArrow belong to this tool block

    if (jsonEnd !== -1) {
      jsonRaw = afterArrow.slice(0, jsonEnd).trim();
      consumed = jsonEnd;
    } else {
      // No JSON — take everything until next [Tool: or end
      const nextTool = afterArrow.search(/\[Tool:/);
      consumed = nextTool !== -1 ? nextTool : afterArrow.length;
      jsonRaw = afterArrow.slice(0, consumed).trim();
    }

    let parsedResult: unknown | null = null;
    try { parsedResult = JSON.parse(jsonRaw); } catch { parsedResult = null; }
    segments.push({ kind: 'tool', toolName, result: jsonRaw, parsedResult });

    // Prose that follows the JSON (before the next [Tool: tag)
    const afterJson = afterArrow.slice(consumed);
    const nextToolIdx = afterJson.search(/\[Tool:/);
    const trailingProse = (nextToolIdx !== -1 ? afterJson.slice(0, nextToolIdx) : afterJson).trim();
    if (trailingProse) segments.push({ kind: 'text', content: trailingProse });

    // Advance cursor past everything we just consumed
    cursor = re.lastIndex + consumed + (nextToolIdx !== -1 ? nextToolIdx : afterJson.length);

    // Reset regex so next exec starts from cursor
    re.lastIndex = cursor;
  }

  // Any remaining text after all tool calls
  if (cursor < content.length) {
    const text = content.slice(cursor).trim();
    if (text) segments.push({ kind: 'text', content: text });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', content }];
}

/** Attempts to pretty-print a string as JSON, returns null if it's not JSON. */
export function tryParseJson(str: string): unknown | null {
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// ─── JSON tree renderer ──────────────────────────────────────────────────────

/** Renders a JSON value as a nested, coloured tree */
export function JsonTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const indent = depth * 14;

  if (value === null) return <span className="text-slate-400 italic">null</span>;
  if (typeof value === 'boolean')
    return <span className="text-amber-600 font-semibold">{String(value)}</span>;
  if (typeof value === 'number')
    return <span className="text-indigo-600 font-semibold">{value}</span>;
  if (typeof value === 'string')
    return <span className="text-emerald-700">"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">[]</span>;
    return (
      <span>
        <span className="text-slate-500">[</span>
        <div style={{ paddingLeft: indent + 14 }}>
          {value.map((item, i) => (
            <div key={i}>
              <JsonTree value={item} depth={depth + 1} />
              {i < value.length - 1 && <span className="text-slate-400">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">]</span>
      </span>
    );
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <span>
        <span className="text-slate-500">{'{'}</span>
        <div style={{ paddingLeft: indent + 14 }}>
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span className="text-slate-500">"{k}"</span>
              <span className="text-slate-400">: </span>
              <JsonTree value={v} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-slate-400">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">{'}'}</span>
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

// ─── Tool call block ─────────────────────────────────────────────────────────

/** Collapsible tool call block. Pass `renderBody` to replace the default JSON view (e.g. with a chart). */
export function ToolCallBlock({
  toolName,
  result,
  parsedResult,
  renderBody,
  defaultOpen = false,
}: Omit<ToolSegment, 'kind'> & { renderBody?: (parsedResult: unknown) => ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  // Determine success/error from the parsed result
  const isSuccess = parsedResult !== null &&
    typeof parsedResult === 'object' &&
    (parsedResult as Record<string, unknown>).success === true;
  const isError = parsedResult !== null &&
    typeof parsedResult === 'object' &&
    (parsedResult as Record<string, unknown>).success === false;

  const statusColor = isSuccess
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : isError
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-indigo-50 border-indigo-200 text-indigo-800';

  const iconColor = isSuccess ? 'text-emerald-500' : isError ? 'text-red-500' : 'text-indigo-500';

  return (
    <div className={`rounded-xl border text-xs font-mono my-2 overflow-hidden ${statusColor}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity"
      >
        <Terminal size={12} className={iconColor} />
        <span className="font-semibold font-sans">Tool:</span>
        <code className="font-mono">{toolName}</code>
        {isSuccess && <CheckCircle2 size={11} className="text-emerald-500 ml-auto" />}
        {isError && <XCircle size={11} className="text-red-500 ml-auto" />}
        {!isSuccess && !isError && <Zap size={11} className="text-indigo-400 ml-auto" />}
        <span className="text-[10px] opacity-60 ml-1">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="border-t border-current/10 px-3 py-3 bg-white/60">
          {renderBody ? (
            renderBody(parsedResult)
          ) : parsedResult !== null ? (
            <div className="font-mono text-[11px] leading-relaxed text-slate-700 overflow-x-auto">
              <JsonTree value={parsedResult} />
            </div>
          ) : (
            <pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-all leading-relaxed">
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
