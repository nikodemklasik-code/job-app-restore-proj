import { useRef, useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Scale, ChevronDown, ChevronUp, Lightbulb, Lock } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useBillingStore } from '@/stores/billingStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

// ─── Practice scenarios ───────────────────────────────────────────────────────

const PRACTICE_SCENARIOS = [
  { label: 'Salary negotiation', text: 'I have received an offer for £65,000 but I was hoping for £75,000 based on my 7 years of experience and the market rate. How should I respond?' },
  { label: 'Contract rate', text: 'The client is offering £450/day but my target is £550/day. I have two competing offers and strong delivery record. What is my opening move?' },
  { label: 'Partnership deal', text: 'We need a 30% revenue share but the other party is pushing for 50%. We bring the technology and they bring distribution. How do I frame the trade-off?' },
  { label: 'Vendor pricing', text: 'Our vendor quoted £120k for annual license. Budget is £90k. We are a reference customer and can commit to 3 years. How do I structure this negotiation?' },
];

// ─── Stream helper ────────────────────────────────────────────────────────────

async function streamNegotiationResponse(
  messages: Message[],
  onChunk: (fullText: string) => void,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/negotiation/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    credentials: 'include',
  });
  if (!response.ok || !response.body) throw new Error(`Stream error ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder
      .decode(value)
      .split('\n')
      .filter((l) => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') return fullText;
      try {
        const parsed = JSON.parse(data) as { chunk?: string };
        if (parsed.chunk) {
          fullText += parsed.chunk;
          onChunk(fullText);
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return fullText;
}

// ─── Markdown renderer (simple) ───────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-slate-200 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-100 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-indigo-300 mt-4 mb-2">$1</h1>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-2 space-y-0.5">$&</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NegotiationCoach() {
  const { user } = useUser();
  const userId = user?.id;

  const { currentPlan, loadBillingData } = useBillingStore();
  useEffect(() => {
    if (userId && !currentPlan) void loadBillingData(userId);
  }, [userId, currentPlan, loadBillingData]);
  const isPremium = currentPlan ? currentPlan.plan !== 'free' : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = 160;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [input]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;
    setInput('');
    setError(null);

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const fullText = await streamNegotiationResponse(
        newMessages,
        (partial) => setStreamingContent(partial),
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      setStreamingContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
    setInput('');
  };

  // ── Pro gate ───────────────────────────────────────────────────────────────

  if (isPremium === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-6 px-4">
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 20,
            padding: '40px 36px',
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          <Lock style={{ width: 40, height: 40, color: '#818cf8', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 700, fontSize: 17, color: '#e2e8f0', marginBottom: 8 }}>
            Negotiation Coach is a Pro feature
          </p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Upgrade to Pro or Autopilot to unlock AI-powered negotiation strategy analysis, tactical scoring, and refined response generation.
          </p>
          <a
            href="/billing"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              padding: '10px 28px',
              borderRadius: 10,
              textDecoration: 'none',
            }}
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scale style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Negotiation Coach</h1>
            <p className="text-xs text-slate-400">AI Negotiation Strategy Analyst</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScenarios((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Practice
            {showScenarios ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New session
            </button>
          )}
        </div>
      </div>

      {/* Practice scenarios */}
      {showScenarios && (
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <p className="text-xs text-slate-400 mb-2 font-medium">Select a scenario to practise:</p>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_SCENARIOS.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setShowScenarios(false);
                  void handleSend(s.text);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-indigo-900/40 hover:border-indigo-600 hover:text-indigo-300 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Scale style={{ width: 28, height: 28, color: '#818cf8' }} />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200 mb-1">Welcome to Negotiation Coach</p>
              <p className="text-sm text-slate-400 max-w-md">
                Share a negotiation message, proposal, or transcript and receive a full strategic analysis with a Tactical Score, position vs interest breakdown, and a refined response.
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Paste your negotiation text below — or use a practice scenario to get started.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' ? (
              <div
                className="max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
                style={{
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#cbd5e1',
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            ) : (
              <div
                className="max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* Streaming bubble */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div
              className="max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#cbd5e1',
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }}
            />
          </div>
        )}

        {/* Thinking indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-5 py-3 text-sm"
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#94a3b8',
              }}
            >
              <span className="inline-flex gap-1 items-center">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-2">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your negotiation message, proposal, or transcript… (Shift+Enter for new line)"
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            style={{ minHeight: 28 }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all"
            style={{
              background: input.trim() && !isStreaming
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(99,102,241,0.2)',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            }}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-600">
          Analysis evaluates negotiation strategy only. Not a hiring or suitability assessment.
        </p>
      </div>
    </div>
  );
}
