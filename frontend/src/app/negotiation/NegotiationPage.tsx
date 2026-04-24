import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Send,
  RefreshCw,
  Scale,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Play,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import PracticeHeroHeader from '@/features/practice-shell/components/PracticeHeroHeader';
import PracticeCostCard from '@/features/practice-shell/components/PracticeCostCard';
import PracticeModeCard from '@/features/practice-shell/components/PracticeModeCard';
import PracticeSessionPanel from '@/features/practice-shell/components/PracticeSessionPanel';
import { PRACTICE_MODULE_CONFIGS } from '@/features/practice-shell/config/practiceModuleConfigs';
import { fetchStream, postForm } from '@/lib/apiClient';


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
  const response = await fetchStream('/api/negotiation/stream', { messages });
  if (!response.ok || !response.body) throw new Error(`Stream error ${response.status}`);
  return consumeStream(response, onChunk);
}

async function streamNegotiationSimulation(
  messages: Message[],
  offer: SimulatorOffer,
  onChunk: (fullText: string) => void,
): Promise<string> {
  const response = await fetchStream('/api/negotiation/simulate', { messages, offer });
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

// ─── Voice helpers ────────────────────────────────────────────────────────────

async function transcribeVoice(blob: Blob): Promise<string> {
  try {
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    const json = await postForm<{ transcript?: string }>('/api/interview/transcribe', form);
    return json.transcript ?? '';
  } catch { return ''; }
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

export default function NegotiationPage() {
  const [appMode, setAppMode] = useState<AppMode>('coach');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Voice state
  const [voiceMode, setVoiceMode] = useState(true);  // voice is default

  // VAD state
  const [, setVadActive] = useState(false);
  const [, setVadSpeechDetected] = useState(false);
  const [, setAudioLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadStreamRef = useRef<MediaStream | null>(null);
  const vadRecorderRef = useRef<MediaRecorder | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadChunksRef = useRef<Blob[]>([]);
  const voiceModeRef = useRef(voiceMode);
  const isStreamingRef = useRef(isStreaming);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);

  // Simulator state
  const [offer, setOffer] = useState<SimulatorOffer>(DEFAULT_OFFER);
  const [simStarted, setSimStarted] = useState(false);
  const [simComplete, setSimComplete] = useState(false);
  const negotiationShell = PRACTICE_MODULE_CONFIGS.negotiation;
  const selectedNegotiationMode = negotiationShell.modes.find((mode) => mode.id === appMode) ?? negotiationShell.modes[0];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  // Stable ref to handleSend to avoid circular deps in VAD
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSendRef = useRef<(text?: string) => Promise<void>>(async () => {});

  const stopVAD = useCallback(() => {
    if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (vadRecorderRef.current && vadRecorderRef.current.state !== 'inactive') {
      vadRecorderRef.current.stop();
    }
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    if (vadStreamRef.current) vadStreamRef.current.getTracks().forEach((t) => t.stop());
    vadFrameRef.current = null;
    silenceTimerRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    vadStreamRef.current = null;
    vadRecorderRef.current = null;
    setVadActive(false);
    setVadSpeechDetected(false);
    setAudioLevel(0);
  }, []);

  const startAutoVAD = useCallback(async () => {
    if (!voiceModeRef.current || isStreamingRef.current) return;
    stopVAD();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      vadStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const recorder = new MediaRecorder(stream);
      vadRecorderRef.current = recorder;
      vadChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) vadChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        if (vadStreamRef.current) vadStreamRef.current.getTracks().forEach((t) => t.stop());
        audioCtxRef.current = null;
        analyserRef.current = null;
        vadStreamRef.current = null;
        vadFrameRef.current = null;
        setVadActive(false);
        setVadSpeechDetected(false);
        setAudioLevel(0);
        const blob = new Blob(vadChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 1500) {
          const transcript = await transcribeVoice(blob);
          if (transcript.trim()) {
            void handleSendRef.current(transcript.trim());
            return;
          }
        }
        // Nothing heard — restart listening after short pause
        setTimeout(() => {
          if (voiceModeRef.current && !isStreamingRef.current) {
            void startAutoVAD();
          }
        }, 600);
      };

      setVadActive(true);
      setVadSpeechDetected(false);
      let speechStarted = false;
      const SILENCE_THRESH = 18;
      const SPEECH_THRESH = 30;
      const SILENCE_DURATION = 1400;

      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
        const lvl = Math.min(100, Math.round((avg / 80) * 100));
        setAudioLevel(lvl);

        if (!speechStarted && avg > SPEECH_THRESH) {
          speechStarted = true;
          setVadSpeechDetected(true);
          if (vadRecorderRef.current && vadRecorderRef.current.state === 'inactive') {
            vadRecorderRef.current.start();
          }
        }

        if (speechStarted) {
          if (avg < SILENCE_THRESH) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                if (vadRecorderRef.current && vadRecorderRef.current.state === 'recording') {
                  vadRecorderRef.current.stop();
                }
                silenceTimerRef.current = null;
              }, SILENCE_DURATION);
            }
          } else {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
        }

        vadFrameRef.current = requestAnimationFrame(loop);
      };
      vadFrameRef.current = requestAnimationFrame(loop);
    } catch {
      // mic access denied — silent fail
    }
  }, [stopVAD]);

  // Stop VAD when voice mode is turned off
  useEffect(() => {
    if (!voiceMode) stopVAD();
  }, [voiceMode, stopVAD]);

  // Cleanup on unmount
  useEffect(() => () => stopVAD(), [stopVAD]);

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
    stopVAD();
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

  // handleMicToggle — reserved for voice input, not yet wired to UI

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

  // ── Simulator setup screen ────────────────────────────────────────────────

  const SimulatorSetup = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
      <div className="mvh-card-glow w-full max-w-lg rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-8">
        <div className="mb-5 flex items-center gap-3">
          <Swords className="h-5 w-5 shrink-0 text-indigo-400" aria-hidden />
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
        <div className="mt-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.08] p-3">
          <p className="text-xs text-slate-400">AI will play HR at <strong className="text-slate-200">{offer.company || 'the company'}</strong>, offering {fmt(offer.offeredSalary, offer.currency)}. Your goal: reach {fmt(offer.targetSalary, offer.currency)}. At the end you'll see how much you left on the table.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleStartSimulation()}
          disabled={!offer.role || !offer.company || isStreaming}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all ${
            offer.role && offer.company && !isStreaming
              ? 'cursor-pointer bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500'
              : 'cursor-not-allowed bg-indigo-500/20 text-slate-400'
          }`}
        >
          <Play className="h-4 w-4" /> Start Simulation
        </button>
      </div>
    </div>
  );

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] w-full max-w-6xl flex-col px-4">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-2 py-4 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
            <Scale className="h-[18px] w-[18px] text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Negotiation</h1>
            <p className="text-xs text-slate-400">{appMode === 'coach' ? 'AI Strategy Analyst' : 'Live Simulation Mode'}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              GPT-4o · online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              type="button"
              onClick={() => handleModeSwitch('coach')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                appMode === 'coach' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-transparent text-slate-500'
              }`}
            >
              Strategy
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('simulator')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                appMode === 'simulator' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-transparent text-slate-500'
              }`}
            >
              <Swords className="h-3 w-3" aria-hidden /> Simulator
            </button>
          </div>
          {/* Voice / Text mode toggle */}
          <button
            type="button"
            onClick={() => setVoiceMode((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              voiceMode
                ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200'
                : 'border-slate-700 bg-transparent text-slate-500'
            }`}
            title={voiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
          >
            {voiceMode ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {voiceMode ? 'Voice' : 'Text'}
          </button>
          {appMode === 'coach' && (
            <button onClick={() => setShowScenarios((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              <Lightbulb className="h-3.5 w-3.5" />
              Scenarios
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

      <div className="px-6 py-2 shrink-0">
        <SupportingMaterialsDisclaimer compact collapsible />
        <div className="mt-3 space-y-3">
          <PracticeHeroHeader hero={negotiationShell.hero} />
          <div className="grid gap-3 md:grid-cols-2">
            {negotiationShell.modes.map((mode) => (
              <PracticeModeCard
                key={mode.id}
                option={mode}
                selected={mode.id === selectedNegotiationMode.id}
                onSelect={(id) => handleModeSwitch(id === 'simulator' ? 'simulator' : 'coach')}
              />
            ))}
          </div>
          <PracticeCostCard cost={selectedNegotiationMode.cost} />
          <PracticeSessionPanel title="Negotiation flow">
            Use Strategy mode to shape your position and language, or Simulator mode for live offer/counter-offer conversation planning.
          </PracticeSessionPanel>
        </div>
      </div>

      {/* Negotiation scenarios (strategy mode only) */}
      {showScenarios && appMode === 'coach' && (
        <div className="mvh-card-glow px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <p className="mb-2 text-xs font-medium text-slate-400">Select a negotiation scenario:</p>
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
                  <p className="text-base font-semibold text-slate-200 mb-1">Welcome to Negotiation</p>
                  <p className="text-sm text-slate-400 max-w-md">Prepare offer/salary conversations with strategy-first analysis: tactical score, position-vs-interest breakdown, and a refined counter-response.</p>
                </div>
                <p className="text-xs text-slate-500 max-w-sm">Paste your negotiation text below — or use a scenario to start planning.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
                  <div className="max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
                    style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', color: '#cbd5e1' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <div className="mvh-card-glow max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="mvh-card-glow max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
                  style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', color: '#cbd5e1' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }} />
              </div>
            )}

            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="mvh-card-glow rounded-2xl px-5 py-3 text-sm" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', color: '#94a3b8' }}>
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
              <div className="mvh-card-glow flex items-end gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.25)' }}>
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
