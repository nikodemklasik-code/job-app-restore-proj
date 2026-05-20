import { useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  GraduationCap, Users, Brain, Target, BarChart2,
  Mic, MicOff, RefreshCw, ChevronRight, Timer,
  CheckCircle, Star, Zap, BookOpen, Loader2, Coins, Volume2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { fetchBlob, postForm } from '@/lib/apiClient';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import { CreditCostPreview } from '@/components/billing/CreditCostPreview';
import PracticeHeroHeader from '@/features/practice-shell/components/PracticeHeroHeader';
import PracticeCostCard from '@/features/practice-shell/components/PracticeCostCard';
import PracticeModeCard from '@/features/practice-shell/components/PracticeModeCard';
import PracticeSupportRail from '@/features/practice-shell/components/PracticeSupportRail';
import { PRACTICE_MODULE_CONFIGS } from '@/features/practice-shell/config/practiceModuleConfigs';

// ─── Question bank by category ────────────────────────────────────────────────

const QUESTION_BANK: Record<string, { q: string; hint: string }[]> = {
  behavioural: [
    { q: "Tell me about a time you solved a difficult problem under pressure.", hint: "Situation → Action → Result" },
    { q: "Tell me about a time you had to influence someone without direct authority.", hint: "Show communication and persuasion" },
    { q: "Describe a mistake you made and what you learned from it.", hint: "Be honest, focus on the learning" },
    { q: "Tell me about a time you received critical feedback and how you responded.", hint: "Show self-awareness and growth" },
    { q: "Tell me about a time you had to make a decision with incomplete information.", hint: "Show judgement and risk management" },
    { q: "Describe a moment when you went beyond what was expected.", hint: "Show initiative and ownership" },
    { q: "Tell me about a time you delivered results despite limited resources.", hint: "Resourcefulness and creativity" },
    { q: "Describe a time you worked with a difficult team member.", hint: "Empathy, conflict resolution" },
    { q: "Tell me about a time you failed to meet a deadline. What happened?", hint: "Honesty + lessons learned" },
    { q: "Describe a situation where you had to adapt quickly to a major change.", hint: "Flexibility and resilience" },
  ],
  technical: [
    { q: "Walk me through how you would debug a performance issue in a production system.", hint: "Structured approach, tools, monitoring" },
    { q: "How do you approach writing code that others will maintain?", hint: "Naming, documentation, simplicity" },
    { q: "Describe your experience with version control and branching strategies.", hint: "Git flow, feature branches, CI/CD" },
    { q: "How do you ensure the quality and reliability of your code?", hint: "Testing, code review, linting" },
    { q: "Walk me through a technical decision you made and the trade-offs involved.", hint: "Show analytical thinking" },
    { q: "How do you stay up to date with changes in your technical field?", hint: "Conferences, blogs, side projects" },
    { q: "Describe a time you introduced a new technology or tool to your team.", hint: "Change management + technical leadership" },
    { q: "How do you approach breaking down a large technical problem?", hint: "First principles, modular thinking" },
    { q: "Tell me about the most complex system you've built or contributed to.", hint: "Architecture, challenges, lessons" },
    { q: "How do you handle disagreements about technical approaches?", hint: "Data-driven, collaborative" },
  ],
  motivation: [
    { q: "What does success look like to you in your next role?", hint: "Be specific, align with the company" },
    { q: "What is one professional skill you're actively improving right now?", hint: "Show self-awareness and ambition" },
    { q: "Why are you looking to make a move at this point in your career?", hint: "Positive framing, forward-looking" },
    { q: "What kind of work environment brings out your best performance?", hint: "Be honest but consider culture fit" },
    { q: "Where do you see yourself in three years?", hint: "Ambition + realism + alignment" },
    { q: "What attracted you to this industry or field?", hint: "Genuine passion or logical journey" },
    { q: "How do you stay motivated when work gets repetitive or tough?", hint: "Intrinsic vs extrinsic motivation" },
    { q: "What type of manager or leadership style do you thrive under?", hint: "Self-awareness, not just flattery" },
    { q: "What does a meaningful workday look like to you?", hint: "Values + contribution" },
    { q: "What is the most important thing you're looking for in your next role?", hint: "One clear priority, not a list" },
  ],
  situational: [
    { q: "How would you prioritise if you had three critical deadlines on the same day?", hint: "Triage, communicate, deliver" },
    { q: "What would you do if you disagreed with a decision made by your manager?", hint: "Respectful challenge, then commit" },
    { q: "How would you handle a team member who is consistently underperforming?", hint: "Empathy first, then process" },
    { q: "What would you do in your first 30 days in a new role?", hint: "Listen, learn, quick wins" },
    { q: "How would you approach a project where requirements kept changing?", hint: "Agility + stakeholder management" },
    { q: "What would you do if you realised mid-project that the approach was wrong?", hint: "Transparency + course correction" },
    { q: "How would you handle a situation where a client was unhappy with your work?", hint: "Acknowledge, fix, prevent" },
    { q: "What would you do if you were asked to do something you thought was unethical?", hint: "Principles + escalation path" },
    { q: "How would you manage stakeholders with conflicting priorities?", hint: "Alignment + communication" },
    { q: "What would you do if your team resisted a change you were leading?", hint: "Understanding + empathy + clarity" },
  ],
};

const CATEGORIES = [
  { key: 'behavioural', label: 'Behavioural', icon: Users, color: '#818cf8', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', desc: 'STAR-method past experiences', questions: QUESTION_BANK.behavioural.length },
  { key: 'technical', label: 'Technical', icon: Brain, color: '#38bdf8', bg: 'bg-sky-500/15', border: 'border-sky-500/30', desc: 'Problem-solving & technical craft', questions: QUESTION_BANK.technical.length },
  { key: 'motivation', label: 'Motivation', icon: Target, color: '#34d399', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', desc: 'Goals, values & career fit', questions: QUESTION_BANK.motivation.length },
  { key: 'situational', label: 'Situational', icon: BarChart2, color: '#fbbf24', bg: 'bg-amber-500/15', border: 'border-amber-500/30', desc: 'Hypothetical scenarios', questions: QUESTION_BANK.situational.length },
] as const;

type Category = keyof typeof QUESTION_BANK;

const COACH_QUICK_TILES: { label: string; cat: Category; idx: number }[] = [
  { label: 'Pressure Story', cat: 'behavioural', idx: 0 },
  { label: 'Influence Without Title', cat: 'behavioural', idx: 1 },
  { label: 'Learning From Failure', cat: 'behavioural', idx: 2 },
  { label: 'Critical Feedback', cat: 'behavioural', idx: 3 },
  { label: 'Prod Debugging', cat: 'technical', idx: 0 },
  { label: 'Maintainable Code', cat: 'technical', idx: 1 },
  { label: 'Version Control Story', cat: 'technical', idx: 2 },
  { label: 'Quality System', cat: 'technical', idx: 3 },
  { label: 'Next Role Success', cat: 'motivation', idx: 0 },
  { label: 'Skill You Are Fixing', cat: 'motivation', idx: 1 },
];

const ANSWER_TIME = 90;
const COOLDOWN = 3;

const COACH_TTS_VOICES = [
  { id: 'coral' as const, label: 'Coral (default, UK)' },
  { id: 'sage' as const, label: 'Sage' },
  { id: 'fable' as const, label: 'Fable' },
  { id: 'nova' as const, label: 'Nova' },
  { id: 'shimmer' as const, label: 'Shimmer' },
  { id: 'onyx' as const, label: 'Onyx' },
  { id: 'alloy' as const, label: 'Alloy' },
  { id: 'echo' as const, label: 'Echo' },
];

async function transcribeCoachAudio(blob: Blob): Promise<string> {
  try {
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    const data = await postForm<{ transcript?: string }>('/api/interview/transcribe', form);
    return data.transcript ?? '';
  } catch {
    return '';
  }
}

async function speakCoachText(text: string, voice: string): Promise<void> {
  try {
    const blob = await fetchBlob('/api/interview/tts', { text: text.slice(0, 2500), voice });
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      void audio.play().catch(() => resolve());
    });
  } catch {
    /* TTS optional */
  }
}

type Phase = 'select' | 'question' | 'countdown' | 'recording' | 'reviewing' | 'evaluating' | 'result';

interface AIFeedback { score: number; label: string; whatWorked: string[]; toImprove: string[]; expertInsight: string; interviewTip: string; creditsUsed: number; }
interface SessionEntry { q: string; hint: string; answer: string; feedback: AIFeedback; }

export default function CoachPage() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const [category, setCategory] = useState<Category | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [qIndex, setQIndex] = useState(0);
  const [countdown, setCountdown] = useState(COOLDOWN);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [ttsVoice, setTtsVoice] = useState<string>('coral');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [ttsBusy, setTtsBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const evaluateMutation = api.coach.evaluateAnswer.useMutation();
  const creditsQuery = api.billing.getAccountState.useQuery({ userId }, { enabled: !!userId, staleTime: 30_000 });
  const activeCat = category ? CATEGORIES.find(c => c.key === category)! : null;
  const questions = category ? QUESTION_BANK[category] : [];
  const currentQ = questions[qIndex];

  const stopLevelMeter = useCallback(() => {
    if (levelRafRef.current != null) { cancelAnimationFrame(levelRafRef.current); levelRafRef.current = null; }
    setMicLevel(0);
    analyserRef.current = null;
    if (audioCtxRef.current) { void audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
  }, []);

  const startLevelMeter = useCallback((stream: MediaStream) => {
    stopLevelMeter();
    mediaStreamRef.current = stream;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);
    analyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i];
      const norm = buf.length ? sum / buf.length / 255 : 0;
      setMicLevel(norm);
      levelRafRef.current = requestAnimationFrame(tick);
    };
    levelRafRef.current = requestAnimationFrame(tick);
  }, [stopLevelMeter]);

  const startSession = (cat: Category, index = 0) => { setCategory(cat); setQIndex(index); setSession([]); setShowHint(false); setAnswerDraft(''); setTranscribeError(null); setMicDenied(false); setPhase('question'); };
  const jumpToBankQuestion = (cat: Category, index: number) => { setCategory(cat); setQIndex(index); setSession([]); setShowHint(false); setAnswerDraft(''); setTranscribeError(null); setMicDenied(false); setPhase('question'); };

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    else { stopLevelMeter(); setPhase((p) => (p === 'recording' ? 'reviewing' : p)); }
  }, [stopLevelMeter]);

  const beginRecording = useCallback(async () => {
    setMicDenied(false); setTranscribeError(null); setTimeLeft(ANSWER_TIME); chunksRef.current = []; recorderRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPhase('recording');
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stopLevelMeter();
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        recorderRef.current = null;
        void (async () => {
          if (blob.size < 200) { setPhase('reviewing'); setTranscribeError('Recording was too short to transcribe. Type your answer or try again.'); return; }
          setIsTranscribing(true);
          setPhase('reviewing');
          const text = await transcribeCoachAudio(blob);
          setIsTranscribing(false);
          if (text.trim()) { setAnswerDraft((prev) => { const p = prev.trim(); return p ? `${p}\n\n${text.trim()}` : text.trim(); }); setTranscribeError(null); }
          else setTranscribeError('Could not transcribe audio. Edit below or record again.');
        })();
      };
      startLevelMeter(stream);
      rec.start(250);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => { setTimeLeft((t) => { if (t <= 1) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; stopRecording(); return 0; } return t - 1; }); }, 1000);
    } catch {
      setMicDenied(true); stopLevelMeter(); setPhase('question');
    }
  }, [startLevelMeter, stopLevelMeter, stopRecording]);

  const startCountdown = useCallback(() => {
    if (cdTimerRef.current) clearInterval(cdTimerRef.current);
    setPhase('countdown'); setCountdown(COOLDOWN);
    let c = COOLDOWN;
    cdTimerRef.current = setInterval(() => { c -= 1; setCountdown(c); if (c <= 0) { if (cdTimerRef.current) clearInterval(cdTimerRef.current); cdTimerRef.current = null; void beginRecording(); } }, 1000);
  }, [beginRecording]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cdTimerRef.current) clearInterval(cdTimerRef.current);
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch { /* noop */ } }
    stopLevelMeter();
  }, [stopLevelMeter]);

  const submitAnswer = async () => {
    const txt = answerDraft.trim();
    if (!txt) return;
    if (!userId) { setEvalError('Sign in to evaluate your answer and use credits.'); return; }
    setEvalError(null); setPhase('evaluating');
    try {
      const result = await evaluateMutation.mutateAsync({ category: category! as 'behavioural' | 'technical' | 'motivation' | 'situational', question: currentQ.q, answer: txt });
      setSession(prev => [...prev, { q: currentQ.q, hint: currentQ.hint, answer: txt, feedback: result as AIFeedback }]);
      setAnswerDraft('');
      void creditsQuery.refetch();
      setPhase('result');
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'Evaluation failed. Please try again.');
      setPhase('reviewing');
    }
  };

  const nextQuestion = () => {
    const next = qIndex + 1;
    if (next >= questions.length) { setPhase('select'); setCategory(null); }
    else { setQIndex(next); setShowHint(false); setAnswerDraft(''); setTranscribeError(null); setPhase('question'); }
  };
  const playQuestionAloud = () => { if (!currentQ) return; setTtsBusy(true); void speakCoachText(currentQ.q, ttsVoice).finally(() => setTtsBusy(false)); };
  const timerColor = timeLeft <= 15 ? '#f87171' : timeLeft <= 30 ? '#fbbf24' : '#34d399';
  const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171';
  const avgScore = session.length > 0 ? Math.round(session.reduce((sum, e) => sum + e.feedback.score, 0) / session.length) : null;
  const showActiveQuestion = !!currentQ && !['select', 'evaluating', 'result'].includes(phase);
  const coachShell = PRACTICE_MODULE_CONFIGS.coach;
  const [selectedCoachMode, setSelectedCoachMode] = useState(coachShell.modes[0]?.id ?? 'quick-reframe');
  const selectedCoachModeConfig = coachShell.modes.find((mode) => mode.id === selectedCoachMode) ?? coachShell.modes[0];
  const meterBars = 28;

  const questionPanel = showActiveQuestion && currentQ ? (
    <div className="mvh-card-glow rounded-2xl px-5 py-4 space-y-3" style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid #1e293b' }}>
      <div className="flex items-start gap-3">
        <p className="flex-1 min-w-0 text-base font-semibold text-white leading-relaxed">{currentQ.q}</p>
        <button type="button" onClick={() => void playQuestionAloud()} disabled={ttsBusy} className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/35 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 disabled:opacity-40 transition" title="Listen to question (OpenAI voice)">
          <Volume2 className="h-5 w-5" />
        </button>
      </div>
      <button type="button" onClick={() => setShowHint(!showHint)} className="text-xs text-indigo-400 hover:text-indigo-300 transition">{showHint ? '▲ Hide hint' : '▼ Show hint'}</button>
      {showHint && <p className="text-xs text-slate-400 rounded-lg border border-white/10 bg-white/5 px-3 py-2">💡 {currentQ.hint}</p>}
    </div>
  ) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}><GraduationCap className="h-5 w-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold text-white">Coach</h1>
            <p className="text-xs text-slate-400">Dedicated coaching workspace: diagnose answer quality, identify weak patterns, and build an improvement strategy.</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />GPT-4o · online</p>
          </div>
        </div>
        {session.length > 0 && avgScore !== null && (
          <div className="mvh-card-glow flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Star className="h-3.5 w-3.5 text-amber-400" /><span className="text-sm font-bold" style={{ color: scoreColor(avgScore) }}>{avgScore}</span><span className="text-xs text-slate-500">avg · {session.length} answered</span></div>
        )}
      </div>

      <SupportingMaterialsDisclaimer compact collapsible defaultExpanded={false} />
      <CreditCostPreview feature="coach_session" title="Coach evaluation credit check" />

      <section className="space-y-3">
        <PracticeHeroHeader hero={coachShell.hero} />
        <div className="grid gap-3 md:grid-cols-2">
          {coachShell.modes.map((mode) => <PracticeModeCard key={mode.id} option={mode} selected={mode.id === selectedCoachModeConfig.id} onSelect={setSelectedCoachMode} />)}
        </div>
        <PracticeCostCard cost={selectedCoachModeConfig.cost} />
        <PracticeSupportRail items={coachShell.supportItems ?? []} />
      </section>

      {phase === 'select' && (
        <div className="space-y-4">
          {session.length > 0 && <div className="mvh-card-glow rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /><p className="text-sm text-emerald-300">Session complete — {session.length} question{session.length !== 1 ? 's' : ''} answered · avg score {avgScore}</p></div>}
          <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
            <div className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-indigo-300" /><p className="text-sm font-semibold text-white">Coach voice (OpenAI TTS)</p></div>
            <p className="text-[11px] text-slate-500">Used when you tap the speaker on a question. Recording uses Whisper on the server.</p>
            <div className="flex flex-wrap gap-2">
              {COACH_TTS_VOICES.map((v) => <button key={v.id} type="button" onClick={() => setTtsVoice(v.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition ${ttsVoice === v.id ? 'border-indigo-400 bg-indigo-500/25 text-white' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'}`}>{v.label}</button>)}
            </div>
          </div>
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-400" /><p className="text-sm font-semibold text-white">Quick start — 10 practice prompts</p></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {COACH_QUICK_TILES.map((tile) => <button key={`${tile.cat}-${tile.idx}-${tile.label}`} type="button" onClick={() => jumpToBankQuestion(tile.cat, tile.idx)} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-left text-xs font-medium text-slate-100 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition min-h-[4.25rem] flex flex-col justify-center">{tile.label}</button>)}
          </div>
          <div className="flex items-center gap-2 pt-2"><BookOpen className="h-4 w-4 text-slate-500" /><p className="text-sm font-semibold text-white">Or pick a full category</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CATEGORIES.map((cat) => { const Icon = cat.icon; return <button key={cat.key} type="button" onClick={() => startSession(cat.key)} className={`mvh-card-glow rounded-2xl border ${cat.border} ${cat.bg} p-4 text-left hover:scale-[1.01] transition`}><div className="flex items-center gap-3"><Icon className="h-5 w-5" style={{ color: cat.color }} /><div><p className="font-semibold text-white">{cat.label}</p><p className="text-xs text-slate-400">{cat.desc} · {cat.questions} questions</p></div></div></button>; })}
          </div>
        </div>
      )}

      {phase !== 'select' && activeCat && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"><div className="flex items-center gap-2"><activeCat.icon className="h-4 w-4" style={{ color: activeCat.color }} /><span className="text-sm font-semibold text-white">{activeCat.label}</span></div><span className="text-xs text-slate-500">Question {qIndex + 1}/{questions.length}</span></div>
          {questionPanel}
          {phase === 'question' && <button type="button" onClick={startCountdown} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><Mic className="mr-2 inline h-4 w-4" />Start recording</button>}
          {phase === 'countdown' && <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center"><p className="text-sm text-slate-400">Get ready…</p><p className="mt-2 text-6xl font-bold text-white">{countdown}</p></div>}
          {phase === 'recording' && <div className="space-y-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-red-100"><MicOff className="mr-2 inline h-4 w-4" />Recording</span><span className="text-lg font-bold" style={{ color: timerColor }}>{timeLeft}s</span></div><div className="flex gap-1">{Array.from({ length: meterBars }).map((_, i) => <div key={i} className={`h-8 flex-1 rounded-full ${i / meterBars < micLevel ? 'bg-red-300' : 'bg-white/10'}`} />)}</div><button type="button" onClick={stopRecording} className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Stop recording</button></div>}
          {(phase === 'reviewing' || phase === 'evaluating') && <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><textarea ref={textareaRef} value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} rows={7} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Type or edit your answer…" />{isTranscribing && <p className="text-xs text-indigo-300"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Transcribing…</p>}{transcribeError && <p className="text-xs text-amber-300">{transcribeError}</p>}{micDenied && <p className="text-xs text-amber-300">Microphone permission denied. You can type your answer instead.</p>}{evalError && <p className="text-xs text-red-300">{evalError}</p>}<div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => void beginRecording()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"><RefreshCw className="mr-2 inline h-4 w-4" />Record again</button><button type="button" onClick={() => void submitAnswer()} disabled={phase === 'evaluating' || !answerDraft.trim()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{phase === 'evaluating' ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Coins className="mr-2 inline h-4 w-4" />}Evaluate answer</button></div></div>}
          {phase === 'result' && session.at(-1) && <div className="space-y-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5"><div className="flex items-center justify-between"><p className="font-semibold text-white">Feedback</p><span className="text-2xl font-bold" style={{ color: scoreColor(session.at(-1)!.feedback.score) }}>{session.at(-1)!.feedback.score}</span></div><p className="text-sm text-emerald-100">{session.at(-1)!.feedback.expertInsight}</p><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold text-emerald-200">What worked</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-50">{session.at(-1)!.feedback.whatWorked.map((x) => <li key={x}>{x}</li>)}</ul></div><div><p className="text-xs font-semibold text-amber-200">Improve next</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-50">{session.at(-1)!.feedback.toImprove.map((x) => <li key={x}>{x}</li>)}</ul></div></div><p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">{session.at(-1)!.feedback.interviewTip}</p><button type="button" onClick={nextQuestion} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Next question <ChevronRight className="ml-1 inline h-4 w-4" /></button></div>}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500"><Timer className="h-3 w-3" />90 seconds per answer · backend credit deduction + history</div>
    </div>
  );
}
