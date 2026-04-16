import { useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  GraduationCap, Users, Brain, Target, BarChart2,
  Mic, MicOff, RefreshCw, ChevronRight, Timer,
  CheckCircle, Star, Zap, BookOpen, Loader2, Coins,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';

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
  {
    key: 'behavioural',
    label: 'Behavioural',
    icon: Users,
    color: '#818cf8',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    desc: 'STAR-method past experiences',
    questions: QUESTION_BANK.behavioural.length,
  },
  {
    key: 'technical',
    label: 'Technical',
    icon: Brain,
    color: '#38bdf8',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    desc: 'Problem-solving & technical craft',
    questions: QUESTION_BANK.technical.length,
  },
  {
    key: 'motivation',
    label: 'Motivation',
    icon: Target,
    color: '#34d399',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    desc: 'Goals, values & career fit',
    questions: QUESTION_BANK.motivation.length,
  },
  {
    key: 'situational',
    label: 'Situational',
    icon: BarChart2,
    color: '#fbbf24',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    desc: 'Hypothetical scenarios',
    questions: QUESTION_BANK.situational.length,
  },
] as const;

type Category = keyof typeof QUESTION_BANK;

const ANSWER_TIME = 90;
const COOLDOWN = 3;
const CREDITS_COST = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'select' | 'question' | 'countdown' | 'recording' | 'reviewing' | 'evaluating' | 'result';

interface AIFeedback {
  score: number;
  label: string;
  whatWorked: string[];
  toImprove: string[];
  expertInsight: string;
  interviewTip: string;
  creditsUsed: number;
}

interface SessionEntry {
  q: string;
  hint: string;
  answer: string;
  feedback: AIFeedback;
}

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

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const evaluateMutation = api.coach.evaluateAnswer.useMutation();
  const creditsQuery = api.billing.getCurrentPlan.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 30_000 },
  );

  const activeCat = category ? CATEGORIES.find(c => c.key === category)! : null;
  const questions = category ? QUESTION_BANK[category] : [];
  const currentQ = questions[qIndex];

  const startSession = (cat: Category) => {
    setCategory(cat);
    setQIndex(0);
    setSession([]);
    setShowHint(false);
    setPhase('question');
  };

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(COOLDOWN);
    let c = COOLDOWN;
    cdTimerRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(cdTimerRef.current!);
        beginRecording();
      }
    }, 1000);
  }, []);

  const beginRecording = async () => {
    setPhase('recording');
    setTimeLeft(ANSWER_TIME);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start();
    } catch { /* mic denied */ }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); stopRecording(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setPhase('reviewing');
  }, []);

  const submitAnswer = async () => {
    const txt = textareaRef.current?.value.trim() ?? '';
    if (!txt) return;
    setEvalError(null);
    setPhase('evaluating');
    try {
      const result = await evaluateMutation.mutateAsync({
        userId,
        category: category! as 'behavioural' | 'technical' | 'motivation' | 'situational',
        question: currentQ.q,
        answer: txt,
      });
      const entry: SessionEntry = {
        q: currentQ.q,
        hint: currentQ.hint,
        answer: txt,
        feedback: result as AIFeedback,
      };
      setSession(prev => [...prev, entry]);
      // Refresh credits display
      void creditsQuery.refetch();
      setPhase('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed. Please try again.';
      setEvalError(msg);
      setPhase('reviewing');
    }
  };

  const nextQuestion = () => {
    const next = qIndex + 1;
    if (next >= questions.length) {
      setPhase('select');
      setCategory(null);
    } else {
      setQIndex(next);
      setShowHint(false);
      setPhase('question');
    }
  };

  const timerColor = timeLeft <= 15 ? '#f87171' : timeLeft <= 30 ? '#fbbf24' : '#34d399';
  const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171';

  const avgScore = session.length > 0
    ? Math.round(session.reduce((sum, e) => sum + e.feedback.score, 0) / session.length)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Coach</h1>
            <p className="text-xs text-slate-400">Structured practice · choose a category · work through questions</p>
          </div>
        </div>
        {session.length > 0 && avgScore !== null && (
            <div className="mvh-card-glow flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-bold" style={{ color: scoreColor(avgScore) }}>{avgScore}</span>
            <span className="text-xs text-slate-500">avg · {session.length} answered</span>
          </div>
        )}
      </div>

      <SupportingMaterialsDisclaimer compact />

      {/* ── Phase: select category ─────────────────────────────────────────────── */}
      {phase === 'select' && (
        <div className="space-y-4">
          {session.length > 0 && (
            <div className="mvh-card-glow rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">Session complete — {session.length} question{session.length !== 1 ? 's' : ''} answered · avg score {avgScore}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Select a category to begin</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const done = session.filter((_, i) => {
                const catQuestions = QUESTION_BANK[cat.key];
                return catQuestions.some(cq => cq.q === session[i]?.q);
              }).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => startSession(cat.key as Category)}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition hover:bg-white/[0.07] ${cat.border} ${cat.bg}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: cat.color + '20' }}>
                    <Icon className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{cat.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-slate-600" />
                      <span className="text-[11px] text-slate-500">{cat.questions} questions</span>
                      {done > 0 && <span className="text-[11px] text-emerald-500">· {done} done this session</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 mt-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active category breadcrumb ─────────────────────────────────────────── */}
      {phase !== 'select' && activeCat && (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: activeCat.color + '20', color: activeCat.color, border: `1px solid ${activeCat.color}40` }}
          >
            <activeCat.icon className="h-3 w-3" />
            {activeCat.label}
          </div>
          <span className="text-xs text-slate-500">Question {qIndex + 1} of {questions.length}</span>
          <button
            onClick={() => { setPhase('select'); }}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition underline underline-offset-2"
          >
            Exit session
          </button>
        </div>
      )}

      {/* ── Phase: question (ready to answer) ─────────────────────────────────── */}
      {phase === 'question' && currentQ && (
        <div className="space-y-4">
          {/* Question card */}
          <div className="mvh-card-glow rounded-2xl px-6 py-5 space-y-3" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
            <p className="text-base font-semibold text-white leading-relaxed">{currentQ.q}</p>
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              {showHint ? '▲ Hide hint' : '▼ Show hint'}
            </button>
            {showHint && (
              <p className="text-xs text-slate-400 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                💡 {currentQ.hint}
              </p>
            )}
          </div>

          {/* Credits cost notice */}
          <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-amber-300">AI evaluation costs <strong>{CREDITS_COST} credits</strong> per answer</span>
            </div>
            {creditsQuery.data && (
              <span className="text-[11px] text-amber-500">{creditsQuery.data.credits} remaining</span>
            )}
          </div>

          {evalError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{evalError}</p>
          )}

          <button
            onClick={startCountdown}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            <Mic className="h-5 w-5" /> Record Answer (90 seconds)
          </button>
          <p className="text-xs text-slate-500 text-center">Or type below and submit for AI evaluation.</p>
          <textarea
            ref={textareaRef}
            placeholder="Type your answer here…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={5}
          />
          <button
            onClick={() => void submitAnswer()}
            className="w-full py-2.5 rounded-xl font-semibold text-sm border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            Submit for AI Evaluation
          </button>
        </div>
      )}

      {/* ── Phase: countdown ──────────────────────────────────────────────────── */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="text-7xl font-black" style={{ color: '#6366f1', fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
          <p className="text-sm text-slate-400">Get ready to answer…</p>
        </div>
      )}

      {/* ── Phase: recording ──────────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-5 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-400">Recording</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" style={{ color: timerColor }} />
              <span className="text-2xl font-black" style={{ color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{timeLeft}s</span>
            </div>
          </div>
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <MicOff className="h-4 w-4" /> Stop Early
          </button>
          <textarea
            ref={textareaRef}
            placeholder="Or type here while recording…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={4}
          />
        </div>
      )}

      {/* ── Phase: reviewing ──────────────────────────────────────────────────── */}
      {phase === 'reviewing' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Recording stopped. Type out what you said to get scored:</p>
          <textarea
            ref={textareaRef}
            placeholder="Type your answer here…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={7}
          />
          <button
            onClick={submitAnswer}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            <ChevronRight className="h-4 w-4" /> Get Score
          </button>
        </div>
      )}

      {/* ── Phase: evaluating ─────────────────────────────────────────────────── */}
      {phase === 'evaluating' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">AI coach is analysing your answer…</p>
          <p className="text-xs text-slate-600">{CREDITS_COST} credits will be deducted</p>
        </div>
      )}

      {/* ── Phase: result ─────────────────────────────────────────────────────── */}
      {phase === 'result' && session.length > 0 && (() => {
        const last = session[session.length - 1];
        const fb = last.feedback;
        return (
          <div className="space-y-4">
            {/* Score */}
            <div className="mvh-card-glow flex items-center gap-4 px-6 py-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
              <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <span className="text-3xl font-black" style={{ color: scoreColor(fb.score) }}>{fb.score}</span>
                <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-white">{fb.label}</p>
                <p className="mt-1 text-[11px] text-slate-600">💡 {last.hint}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Coins className="h-3 w-3" />
                  <span>{fb.creditsUsed} credits used</span>
                </div>
              </div>
            </div>

            {/* What worked */}
            {fb.whatWorked.length > 0 && (
              <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">What worked</p>
                {fb.whatWorked.map((w, i) => (
                  <p key={i} className="text-sm text-emerald-300 leading-relaxed">• {w}</p>
                ))}
              </div>
            )}

            {/* To improve */}
            {fb.toImprove.length > 0 && (
              <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">To improve</p>
                {fb.toImprove.map((t, i) => (
                  <p key={i} className="text-sm text-red-300 leading-relaxed">• {t}</p>
                ))}
              </div>
            )}

            {/* Expert insight */}
            {fb.expertInsight && (
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.22)' }}>
                <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">Expert insight</p>
                <p className="text-sm text-indigo-200 leading-relaxed">{fb.expertInsight}</p>
              </div>
            )}

            {/* Interview tip */}
            {fb.interviewTip && (
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5">🎯 In the interview</p>
                <p className="text-sm text-amber-200 leading-relaxed">{fb.interviewTip}</p>
              </div>
            )}

            {/* Session progress */}
            <div className="flex items-center gap-2 pt-1">
              {session.map((e, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: scoreColor(e.feedback.score) + '60', outline: i === session.length - 1 ? `2px solid ${scoreColor(e.feedback.score)}` : 'none' }}
                  title={`Q${i + 1}: ${e.feedback.score}`}
                />
              ))}
              {Array.from({ length: questions.length - session.length }).map((_, i) => (
                <div key={`empty-${i}`} className="h-2 flex-1 rounded-full bg-white/10" />
              ))}
            </div>
            <p className="text-xs text-slate-600 text-right">{session.length} / {questions.length} questions · {session.reduce((s, e) => s + e.feedback.creditsUsed, 0)} credits used this session</p>

            <div className="flex gap-2">
              {qIndex + 1 < questions.length ? (
                <button
                  onClick={nextQuestion}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                >
                  <ChevronRight className="h-4 w-4" /> Next Question
                </button>
              ) : (
                <button
                  onClick={() => { setPhase('select'); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}
                >
                  <CheckCircle className="h-4 w-4" /> Complete Session
                </button>
              )}
              <button
                onClick={() => { setPhase('question'); setShowHint(false); }}
                className="px-4 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
                title="Redo this question"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
