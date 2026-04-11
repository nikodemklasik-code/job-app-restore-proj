import { useRef, useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Scale, ChevronDown, ChevronUp, Lightbulb, Lock, Play, Swords } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useBillingStore } from '@/stores/billingStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

type AppMode = 'coach' | 'simulator';

interface SimulatorOffer {
  role: string;
  company: string;
  offeredSalary: number;
  currency: string;
  targetSalary: number;
  marketRate: number;
  benefits: string;
}

const DEFAULT_OFFER: SimulatorOffer = {
  role: '',
  company: '',
  offeredSalary: 55000,
  currency: 'GBP',
  targetSalary: 65000,
  marketRate: 62000,
  benefits: 'pension, 25 days holiday',
};

// ─── Practice scenarios ───────────────────────────────────────────────────────

const PRACTICE_SCENARIOS = [
  { label: 'Salary negotiation', text: 'I have received an offer for £65,000 but I was hoping for £75,000 based on my 7 years of experience and the market rate. How should I respond?' },
  { label: 'Contract rate', text: 'The client is offering £450/day but my target is £550/day. I have two competing offers and strong delivery record. What is my opening move?' },
  { label: 'Partnership deal', text: 'We need a 30% revenue share but the other party is pushing for 50%. We bring the technology and they bring distribution. How do I frame the trade-off?' },
  { label: 'Vendor pricing', text: 'Our vendor quoted £120k for annual license. Budget is £90k. We are a reference customer and can commit to 3 years. How do I structure this negotiation?' },
];

// ─── Stream helpers ───────────────────────────────────────────────────────────

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
  return consumeStream(response, onChunk);
}

async function streamNegotiationSimulation(
  messages: Message[],
  offer: SimulatorOffer,
  onChunk: (fullText: string) => void,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/negotiation/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, offer }),
    credentials: 'include',
  });
  if (!response.ok || !response.body) throw new Error(`Stream error ${response.status}`);
  return consumeStream(response, onChunk);
}

async function consumeStream(response: Response, onChunk: (fullText: string) => void): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter((l) => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') return fullText;
      try {
        const parsed = JSON.parse(data) as { chunk?: string };
        if (parsed.chunk) { fullText += parsed.chunk; onChunk(fullText); }
      } catch { /* ignore */ }
    }
  }
  return fullText;
}

// ─── Markdown renderer (simple) ───────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(text: string): string {
  // Escape HTML first to prevent XSS, then apply safe markdown patterns
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-slate-200 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-100 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-indigo-300 mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-2 space-y-0.5">$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
}

// ─── Currency formatter ───────────────────────────────────────────────────────

function fmt(n: number, currency: string): string {
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  return `${sym}${n.toLocaleString()}`;
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

  const [appMode, setAppMode] = useState<AppMode>('coach');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Simulator state
  const [offer, setOffer] = useState<SimulatorOffer>(DEFAULT_OFFER);
  const [simStarted, setSimStarted] = useState(false);
  const [simComplete, setSimComplete] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = 160;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [input]);

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
      const streamFn = appMode === 'simulator'
        ? (msgs: Message[], onChunk: (t: string) => void) => streamNegotiationSimulation(msgs, offer, onChunk)
        : (msgs: Message[], onChunk: (t: string) => void) => streamNegotiationResponse(msgs, onChunk);

      const fullText = await streamFn(newMessages, (partial) => setStreamingContent(partial));
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      setStreamingContent('');
      if (appMode === 'simulator' && fullText.includes('[SIMULATION COMPLETE]')) {
        setSimComplete(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, appMode, offer]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  const handleReset = () => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
    setInput('');
    setSimStarted(false);
    setSimComplete(false);
  };

  const handleStartSimulation = async () => {
    if (!offer.role || !offer.company) return;
    setSimStarted(true);
    setMessages([]);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);
    // Kick off the simulation — send empty user messages array so AI delivers its opening offer
    try {
      const fullText = await streamNegotiationSimulation([], offer, (partial) => setStreamingContent(partial));
      setMessages([{ role: 'assistant', content: fullText }]);
      setStreamingContent('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleModeSwitch = (mode: AppMode) => {
    if (mode === appMode) return;
    setAppMode(mode);
    handleReset();
  };

  // ── Pro gate ───────────────────────────────────────────────────────────────

  if (isPremium === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-6 px-4">
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '40px 36px', maxWidth: 480, textAlign: 'center' }}>
          <Lock style={{ width: 40, height: 40, color: '#818cf8', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 700, fontSize: 17, color: '#e2e8f0', marginBottom: 8 }}>Negotiation Coach is a Pro feature</p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Upgrade to Pro or Autopilot to unlock AI-powered negotiation strategy analysis and the interactive Negotiation Simulator.</p>
          <a href="/billing" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 28px', borderRadius: 10, textDecoration: 'none' }}>Upgrade to Pro</a>
        </div>
      </div>
    );
  }

  // ── Simulator setup screen ────────────────────────────────────────────────

  const SimulatorSetup = () => (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 gap-6">
      <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '32px', maxWidth: 520, width: '100%' }}>
        <div className="flex items-center gap-3 mb-5">
          <Swords style={{ width: 22, height: 22, color: '#818cf8' }} />
          <h2 className="text-lg font-bold text-white">Set Up Your Simulation</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Role being offered</label>
            <input value={offer.role} onChange={(e) => setOffer((o) => ({ ...o, role: e.target.value }))}
              placeholder="e.g. Senior Product Manager" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Company</label>
            <input value={offer.company} onChange={(e) => setOffer((o) => ({ ...o, company: e.target.value }))}
              placeholder="e.g. Acme Corp" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Currency</label>
            <select value={offer.currency} onChange={(e) => setOffer((o) => ({ ...o, currency: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
              <option value="GBP">GBP £</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Their offer</label>
            <input type="number" value={offer.offeredSalary} onChange={(e) => setOffer((o) => ({ ...o, offeredSalary: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Your target salary</label>
            <input type="number" value={offer.targetSalary} onChange={(e) => setOffer((o) => ({ ...o, targetSalary: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Market rate (optional)</label>
            <input type="number" value={offer.marketRate} onChange={(e) => setOffer((o) => ({ ...o, marketRate: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Benefits (optional)</label>
            <input value={offer.benefits} onChange={(e) => setOffer((o) => ({ ...o, benefits: e.target.value }))}
              placeholder="e.g. pension, 25 days holiday, bonus" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p className="text-xs text-slate-400">AI will play HR at <strong className="text-slate-200">{offer.company || 'the company'}</strong>, offering {fmt(offer.offeredSalary, offer.currency)}. Your goal: reach {fmt(offer.targetSalary, offer.currency)}. At the end you'll see how much you left on the table.</p>
        </div>
        <button onClick={() => void handleStartSimulation()} disabled={!offer.role || !offer.company || isStreaming}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{ background: offer.role && offer.company ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.2)', color: '#fff', cursor: offer.role && offer.company ? 'pointer' : 'not-allowed' }}>
          <Play className="h-4 w-4" /> Start Simulation
        </button>
      </div>
    </div>
  );

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Negotiation Coach</h1>
            <p className="text-xs text-slate-400">{appMode === 'coach' ? 'AI Strategy Analyst' : 'Live Simulation Mode'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button onClick={() => handleModeSwitch('coach')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: appMode === 'coach' ? 'rgba(99,102,241,0.3)' : 'transparent', color: appMode === 'coach' ? '#a5b4fc' : '#64748b' }}>
              Coach
            </button>
            <button onClick={() => handleModeSwitch('simulator')}
              className="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1"
              style={{ background: appMode === 'simulator' ? 'rgba(99,102,241,0.3)' : 'transparent', color: appMode === 'simulator' ? '#a5b4fc' : '#64748b' }}>
              <Swords className="h-3 w-3" /> Simulator
            </button>
          </div>
          {appMode === 'coach' && (
            <button onClick={() => setShowScenarios((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              <Lightbulb className="h-3.5 w-3.5" />
              Practice
              {showScenarios ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {(messages.length > 0 || simStarted) && (
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              {appMode === 'simulator' ? 'New simulation' : 'New session'}
            </button>
          )}
        </div>
      </div>

      {/* Practice scenarios (coach mode only) */}
      {showScenarios && appMode === 'coach' && (
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <p className="text-xs text-slate-400 mb-2 font-medium">Select a scenario to practise:</p>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_SCENARIOS.map((s) => (
              <button key={s.label} onClick={() => { setShowScenarios(false); void handleSend(s.text); }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-indigo-900/40 hover:border-indigo-600 hover:text-indigo-300 transition-colors">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Simulator setup or active simulation */}
      {appMode === 'simulator' && !simStarted && !isStreaming ? (
        <SimulatorSetup />
      ) : (
        <>
          {/* Simulator progress bar */}
          {appMode === 'simulator' && simStarted && (
            <div className="px-6 py-2 border-b border-slate-800 bg-slate-900/40 shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Offer: <strong className="text-slate-200">{fmt(offer.offeredSalary, offer.currency)}</strong></span>
                <span>Your target: <strong className="text-indigo-400">{fmt(offer.targetSalary, offer.currency)}</strong></span>
                {simComplete && <span className="text-emerald-400 font-semibold">Simulation complete ✓</span>}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && !isStreaming && appMode === 'coach' && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scale style={{ width: 28, height: 28, color: '#818cf8' }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-200 mb-1">Welcome to Negotiation Coach</p>
                  <p className="text-sm text-slate-400 max-w-md">Share a negotiation message, proposal, or transcript and receive a full strategic analysis with a Tactical Score, position vs interest breakdown, and a refined response.</p>
                </div>
                <p className="text-xs text-slate-500 max-w-sm">Paste your negotiation text below — or use a practice scenario to get started.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
                  <div className="max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
                    style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', color: '#cbd5e1' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <div className="max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
                  style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', color: '#cbd5e1' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }} />
              </div>
            )}

            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-5 py-3 text-sm" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', color: '#94a3b8' }}>
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
                <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-2">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          {!simComplete && (
            <div className="shrink-0 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
              <div className="flex items-end gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={appMode === 'simulator' ? 'Type your response to the HR offer… (Shift+Enter for new line)' : 'Paste your negotiation message, proposal, or transcript… (Shift+Enter for new line)'}
                  disabled={isStreaming} rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
                  style={{ minHeight: 28 }} />
                <button onClick={() => void handleSend()} disabled={!input.trim() || isStreaming}
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                  style={{ background: input.trim() && !isStreaming ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.2)', cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed' }}>
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-600">
                {appMode === 'simulator' ? 'Simulation evaluates negotiation moves only. Not a hiring or suitability assessment.' : 'Analysis evaluates negotiation strategy only. Not a hiring or suitability assessment.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
