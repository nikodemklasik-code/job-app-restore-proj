import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api, trpcClient } from '@/lib/api';
import { fetchBlob, fetchStream, postForm } from '@/lib/apiClient';
import { Mic, MicOff, PhoneOff, RefreshCw, Briefcase, Video, VideoOff, ChevronDown, ChevronUp, TrendingUp, FileDown, StickyNote, Star, Zap, Lock } from 'lucide-react';
import { interviewModeLabels } from '../../../../shared/interview';
import type { InterviewMode } from '../../../../shared/interview';
import { useBillingStore } from '@/stores/billingStore';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import PracticeHeroHeader from '@/features/practice-shell/components/PracticeHeroHeader';
import PracticeCostCard from '@/features/practice-shell/components/PracticeCostCard';
import PracticeProgressBadge from '@/features/practice-shell/components/PracticeProgressBadge';
import EstimatedSpendInlineNotice from '@/features/practice-shell/components/EstimatedSpendInlineNotice';
import { PRACTICE_MODULE_CONFIGS } from '@/features/practice-shell/config/practiceModuleConfigs';

// ─── Wave/avatar keyframes injected once ─────────────────────────────────────
const AVATAR_STYLES = `
  @keyframes wave {
    0%, 100% { height: 8px; }
    50% { height: 32px; }
  }
  @keyframes bounce-dot {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  @keyframes ping-dot {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.4); opacity: 0.4; }
  }
  @keyframes ping-ring {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes avatar-breathe {
    0%, 100% { transform: scale(1.0); }
    50% { transform: scale(1.01); }
  }
  @keyframes avatar-nod {
    0%, 100% { transform: translateY(0px); }
    25% { transform: translateY(-3px); }
    75% { transform: translateY(1px); }
  }
  @keyframes eyes-look-up {
    0%, 70%, 100% { transform: translateY(0); }
    80%, 90% { transform: translateY(-2px); }
  }
  @keyframes eye-blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }
  @keyframes avatar-wave-bars {
    0%, 100% { height: 4px; transform: scaleY(0.5); }
    50% { height: 20px; transform: scaleY(1); }
  }
  @keyframes slide-up {
    from { transform: translate(-50%, 20px); opacity: 0; }
    to   { transform: translate(-50%, 0);   opacity: 1; }
  }
  @keyframes fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'lobby'       // pre-call: job select + camera preview
  | 'connecting'  // brief "Connecting…" animation
  | 'ai-speaking'
  | 'user-turn'
  | 'processing'
  | 'complete';

type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

export type RecruiterPersona = 'hr' | 'hiring-manager' | 'tech-lead';

export const PERSONA_CONFIG: Record<RecruiterPersona, { label: string; name: string; role: string; icon: string; color: string }> = {
  'hr':             { label: 'HR Recruiter',   name: 'Sarah', role: 'HR Business Partner', icon: '👩‍💼', color: '#6366f1' },
  'hiring-manager': { label: 'Hiring Manager', name: 'James', role: 'Engineering Manager',  icon: '👔',  color: '#3b82f6' },
  'tech-lead':      { label: 'Tech Lead',      name: 'Alex',  role: 'Senior Tech Lead',      icon: '💻',  color: '#0ea5e9' },
};

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface JobOption {
  id: string;
  title: string;
  company: string;
  description?: string | null;
}

interface AdaptiveInsights {
  type?: string;
  averageScore: number;
  sessionCount: number;
  suggestedDifficulty: string;
  adaptationNote?: string;
  weakAreas?: string[];
  strongAreas?: string[];
}

interface TurnFeedback {
  score: number;
  starPresence: { situation: boolean; task: boolean; action: boolean; result: boolean };
  improvementTip: string;
  clarityScore: number;
  confidenceNote: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_EXCHANGES = 8;

// ─── Live Interview Summary type ──────────────────────────────────────────────

interface LiveInterviewSummary {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  communicationNotes: string;
  nextFocus: string[];
}

// ─── Client-side STAR helpers (fast, no network) ─────────────────────────────

function detectStarClient(t: string): TurnFeedback['starPresence'] {
  const s = t.toLowerCase();
  return {
    situation: /\b(when|at the time|there was|we were|our team|last year|during|in my previous|at \w+ company|back in)\b/.test(s),
    task: /\b(i needed to|my (task|goal|job|responsibility) was|i was responsible|i had to|assigned to|my role was|tasked with)\b/.test(s),
    action: /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized|designed))\b/.test(s),
    result: /\b(result(ed)?( in)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|we (launched|delivered|hit|exceeded|met))\b/.test(s),
  };
}

function starTipClient(star: TurnFeedback['starPresence'], t: string): string {
  const missing = (Object.entries(star) as [string, boolean][]).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length === 0) return t.length < 120 ? 'Good coverage — add more detail and a quantified result.' : 'Excellent STAR structure. Consider adding a measurable outcome.';
  const tips: Record<string, string> = {
    situation: 'Add context — briefly describe the situation or project.',
    task: 'Clarify your specific responsibility — what were YOU tasked with?',
    action: 'Emphasise your own actions — use "I did…" statements.',
    result: 'Always close with the outcome — numbers, impact, or what was learned.',
  };
  return tips[missing[0]] ?? 'Structure your answer: Situation → Task → Action → Result.';
}

function scoreTurnClient(transcript: string): TurnFeedback {
  const star = detectStarClient(transcript);
  const starCount = Object.values(star).filter(Boolean).length;
  const baseScore = 55 + starCount * 10 + Math.min(transcript.length / 30, 10);
  const score = Math.round(Math.min(100, Math.max(30, baseScore)));
  const fillers = (transcript.toLowerCase().match(/\b(um|uh|like|you know|kind of|sort of)\b/g) ?? []).length;
  const clarityScore = Math.max(30, Math.min(100, 75 - fillers * 8 + (transcript.length > 200 ? 10 : 0)));
  const confidenceNote =
    fillers >= 5 ? 'Many filler words detected — try pausing instead of saying "um".' :
    transcript.length < 60 ? 'Very brief answer — expand with a specific example.' :
    'Delivery is solid. Ground your answer in concrete specifics.';
  return { score, starPresence: star, improvementTip: starTipClient(star, transcript), clarityScore, confidenceNote };
}

// ─── Coaching plan generator (client-side, from all user messages) ────────────

function generateCoachingPlan(userMessages: string[]): { area: string; action: string; priority: 'high' | 'medium' | 'low' }[] {
  const combined = userMessages.join(' ').toLowerCase();
  const plan: { area: string; action: string; priority: 'high' | 'medium' | 'low' }[] = [];

  const starScores = userMessages.map((m) => {
    const s = detectStarClient(m);
    return Object.values(s).filter(Boolean).length;
  });
  const avgStar = starScores.reduce((a, b) => a + b, 0) / (starScores.length || 1);
  if (avgStar < 2.5) plan.push({ area: 'STAR Structure', action: 'Practise structuring every answer with Situation → Task → Action → Result. Record yourself answering 3 behavioral questions this week.', priority: 'high' });

  const fillers = (combined.match(/\b(um|uh|like|you know|kind of)\b/g) ?? []).length;
  if (fillers >= 6) plan.push({ area: 'Filler Words', action: 'Record your answers and count filler words. Replace each "um" with a deliberate pause — it sounds more confident.', priority: 'high' });

  const hasNumbers = /\b\d+\s*(percent|%|people|users|days|weeks|months|k|million|thousand)\b/.test(combined);
  if (!hasNumbers) plan.push({ area: 'Quantified Results', action: 'Add metrics to at least 3 answers. For every achievement, ask: "By how much?" or "How many people were impacted?"', priority: 'high' });

  const hasSituation = userMessages.filter((m) => detectStarClient(m).situation).length;
  if (hasSituation < userMessages.length * 0.5) plan.push({ area: 'Storytelling', action: 'Open every answer with a brief scene-setting sentence. E.g. "At my previous company, we were facing X…"', priority: 'medium' });

  const avgLen = userMessages.reduce((a, b) => a + b.length, 0) / (userMessages.length || 1);
  if (avgLen < 120) plan.push({ area: 'Answer Depth', action: 'Aim for 90-120 seconds per answer. After each answer in practice, ask yourself: "What one extra detail would make this stronger?"', priority: 'medium' });

  if (plan.length < 3) plan.push({ area: 'Active Listening', action: 'In your next practice, consciously reference the interviewer\'s exact words in your response to show engagement.', priority: 'low' });

  return plan.slice(0, 5);
}

// ─── Markdown report generator ────────────────────────────────────────────────

function generateMarkdownReport(params: {
  job: JobOption;
  mode: InterviewMode;
  messages: Message[];
  callSeconds: number;
  exchangeCount: number;
  notes: string;
  modeLabel: string;
}): string {
  const { job, messages, callSeconds, exchangeCount, notes, modeLabel } = params;
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const duration = `${Math.floor(callSeconds / 60)}m ${callSeconds % 60}s`;
  const userMsgs = messages.filter((m) => m.role === 'user').map((m) => m.content);
  const coachingPlan = generateCoachingPlan(userMsgs);

  let md = `# Interview Practice Report\n\n`;
  md += `**Role:** ${job.title} at ${job.company}\n`;
  md += `**Mode:** ${modeLabel}\n`;
  md += `**Date:** ${date}\n`;
  md += `**Duration:** ${duration} · ${exchangeCount} exchanges\n\n`;
  md += `---\n\n## Transcript\n\n`;
  messages.forEach((m) => {
    const speaker = m.role === 'assistant' ? `**AI Interviewer**` : `**You**`;
    md += `${speaker}: ${m.content}\n\n`;
  });
  md += `---\n\n## Coaching Plan\n\n`;
  coachingPlan.forEach((item, i) => {
    md += `### ${i + 1}. ${item.area} _(${item.priority} priority)_\n${item.action}\n\n`;
  });
  if (notes.trim()) { md += `---\n\n## Your Notes\n\n${notes}\n`; }
  return md;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function streamAIResponse(
  messages: Array<{ role: string; content: string }>,
  job: { title: string; company: string; description?: string },
  onChunk: (fullText: string) => void,
  onInsights: (insights: AdaptiveInsights) => void,
  userId?: string,
  mode?: string,
): Promise<string> {
  const response = await fetchStream('/api/interview/stream', { messages, job, userId: userId ?? undefined, mode });
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
        const parsed = JSON.parse(data) as { chunk?: string; type?: string; adaptationNote?: string; averageScore?: number; suggestedDifficulty?: string; sessionCount?: number };
        if (parsed.type === 'insights') {
          onInsights(parsed as AdaptiveInsights);
          continue;
        }
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

async function playTTS(text: string): Promise<void> {
  try {
    const blob = await fetchBlob('/api/interview/tts', { text });
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => resolve());
    });
  } catch {
    // TTS failure is non-fatal — continue without audio
  }
}

async function transcribeAudio(blob: Blob): Promise<string> {
  try {
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    const json = await postForm<{ transcript?: string }>('/api/interview/transcribe', form);
    return json.transcript ?? '';
  } catch {
    return '';
  }
}

// ─── Human Avatar Component ───────────────────────────────────────────────────

function Avatar({ state }: { state: AvatarState }) {
  // Blink timer for listening/idle states
  const [blinkPhase, setBlinkPhase] = useState(false);
  useEffect(() => {
    if (state !== 'listening' && state !== 'idle') { setBlinkPhase(false); return; }
    const interval = setInterval(() => {
      setBlinkPhase(true);
      setTimeout(() => setBlinkPhase(false), 150);
    }, state === 'listening' ? 3000 : 4500);
    return () => clearInterval(interval);
  }, [state]);

  const ringColor =
    state === 'speaking' ? '#6366f1' :
    state === 'listening' ? '#22c55e' :
    state === 'thinking' ? '#f59e0b' :
    '#475569';

  const ringAnimation =
    state === 'speaking' ? 'ping-ring 1.2s ease-in-out infinite' :
    state === 'idle' ? 'avatar-breathe 3s ease-in-out infinite' :
    'none';

  const faceAnimation =
    state === 'speaking' ? 'avatar-nod 1.5s ease-in-out infinite' :
    state === 'thinking' ? 'eyes-look-up 4s ease-in-out infinite' :
    state === 'idle' ? 'avatar-breathe 3s ease-in-out infinite' :
    'none';

  const eyeScaleY = blinkPhase ? 0.08 : 1;
  // When listening, eyes are slightly squinted attentively
  const eyeRy = state === 'listening' ? (blinkPhase ? 0.4 : 6) : (blinkPhase ? 0.4 : 8);

  // Pupil offsets for thinking (look up-right)
  const pupilDy = state === 'thinking' ? -2 : 0;
  const pupilDx = state === 'thinking' ? 1 : 0;

  /** Scales on phones / large displays; keeps interview face readable */
  const avatarSize = 'clamp(132px, 36vmin, 220px)';

  return (
    <div
      className="relative"
      style={{
        width: avatarSize,
        height: avatarSize,
        animation: ringAnimation,
      }}
      aria-label={`AI interviewer — ${state}`}
    >
      {/* Glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: `3px solid ${ringColor}`,
          opacity: state === 'idle' ? 0.35 : 0.85,
          transition: 'border-color 0.4s, opacity 0.4s',
          animation: state === 'speaking' ? 'ping-ring 1.2s ease-in-out infinite' : 'none',
        }}
      />

      {/* SVG face — animated as a unit */}
      <svg
        viewBox="0 0 160 160"
        style={{ width: '100%', height: '100%', borderRadius: '50%', animation: faceAnimation, display: 'block' }}
        aria-hidden="true"
      >
        {/* Dark background */}
        <circle cx="80" cy="80" r="80" fill="#1e293b" />

        {/* Shirt / shoulders */}
        <ellipse cx="80" cy="160" rx="52" ry="24" fill="#4338ca" />
        {/* Collar */}
        <path d="M68 138 L80 148 L92 138" fill="#3730a3" />

        {/* Neck */}
        <rect x="66" y="118" width="28" height="26" rx="8" fill="#c9956c" />

        {/* Head */}
        <ellipse cx="80" cy="82" rx="36" ry="40" fill="#daa570" />

        {/* Hair — dark brown, covers top of head */}
        <ellipse cx="80" cy="47" rx="37" ry="19" fill="#3b1f07" />
        {/* Side hair left */}
        <ellipse cx="45" cy="68" rx="11" ry="22" fill="#3b1f07" />
        {/* Side hair right */}
        <ellipse cx="115" cy="68" rx="11" ry="22" fill="#3b1f07" />
        {/* Hair front strand line for realism */}
        <path d="M56 52 Q64 58 62 66" stroke="#2a1504" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M104 52 Q96 58 98 66" stroke="#2a1504" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Ears */}
        <ellipse cx="44" cy="84" rx="6" ry="9" fill="#c9956c" />
        <ellipse cx="116" cy="84" rx="6" ry="9" fill="#c9956c" />
        <ellipse cx="44" cy="84" rx="3.5" ry="5.5" fill="#b8845c" />
        <ellipse cx="116" cy="84" rx="3.5" ry="5.5" fill="#b8845c" />

        {/* Eyebrows */}
        <path d="M55 70 Q63 65 71 70" stroke="#3b1f07" strokeWidth="2.5" fill="none" strokeLinecap="round"
          style={{ transform: state === 'thinking' ? 'translateY(-2px)' : 'none', transition: 'transform 0.5s' }} />
        <path d="M89 70 Q97 65 105 70" stroke="#3b1f07" strokeWidth="2.5" fill="none" strokeLinecap="round"
          style={{ transform: state === 'thinking' ? 'translateY(-2px)' : 'none', transition: 'transform 0.5s' }} />

        {/* Eye whites */}
        <ellipse cx="63" cy="82" rx="8.5" ry={eyeRy} fill="white"
          style={{ transformOrigin: '63px 82px', transform: `scaleY(${eyeScaleY})`, transition: 'transform 0.08s' }} />
        <ellipse cx="97" cy="82" rx="8.5" ry={eyeRy} fill="white"
          style={{ transformOrigin: '97px 82px', transform: `scaleY(${eyeScaleY})`, transition: 'transform 0.08s' }} />

        {/* Pupils */}
        {!blinkPhase && (
          <>
            <circle cx={64 + pupilDx} cy={83 + pupilDy} r="5" fill="#1a0f00" />
            <circle cx={98 + pupilDx} cy={83 + pupilDy} r="5" fill="#1a0f00" />
            {/* Iris colour */}
            <circle cx={64 + pupilDx} cy={83 + pupilDy} r="3" fill="#5b3a29" />
            <circle cx={98 + pupilDx} cy={83 + pupilDy} r="3" fill="#5b3a29" />
            {/* Eye shine */}
            <circle cx={66 + pupilDx} cy={81 + pupilDy} r="1.5" fill="rgba(255,255,255,0.9)" />
            <circle cx={100 + pupilDx} cy={81 + pupilDy} r="1.5" fill="rgba(255,255,255,0.9)" />
          </>
        )}

        {/* Nose */}
        <path d="M80 90 L76 102 Q80 105 84 102 Z" fill="#b8845c" />
        <ellipse cx="76" cy="102" rx="4" ry="2.5" fill="#a67040" />
        <ellipse cx="84" cy="102" rx="4" ry="2.5" fill="#a67040" />

        {/* Mouth — changes based on state */}
        {state === 'speaking' ? (
          <>
            {/* Open mouth when speaking */}
            <ellipse cx="80" cy="113" rx="11" ry="7" fill="#7a1515" />
            <ellipse cx="80" cy="110" rx="11" ry="4" fill="#c9956c" />
            {/* Teeth hint */}
            <rect x="70" y="109" width="20" height="4" rx="2" fill="#f5f0e8" />
          </>
        ) : (
          /* Subtle smile */
          <path d="M70 110 Q80 118 90 110" stroke="#b8845c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Subtle cheek flush */}
        <ellipse cx="54" cy="95" rx="8" ry="5" fill="rgba(220,130,100,0.25)" />
        <ellipse cx="106" cy="95" rx="8" ry="5" fill="rgba(220,130,100,0.25)" />
      </svg>

      {/* Speaking waveform overlay */}
      {state === 'speaking' && (
        <div style={{
          position: 'absolute',
          bottom: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 3,
          alignItems: 'flex-end',
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 4,
                background: '#818cf8',
                borderRadius: 2,
                animation: `avatar-wave-bars 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking dots overlay */}
      {state === 'thinking' && (
        <div style={{
          position: 'absolute',
          bottom: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
        }}>
          {[0, 200, 400].map((delay, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#f59e0b',
                animation: 'bounce-dot 0.8s ease-in-out infinite',
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mic Level Bars ───────────────────────────────────────────────────────────

function MicLevelBars({ levels }: { levels: number[] }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {levels.map((lvl, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: `${Math.max(8, lvl * 32)}px`,
            background: 'linear-gradient(to top, #22c55e, #4ade80)',
            borderRadius: 3,
            transition: 'height 0.05s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewPractice() {
  const { user } = useUser();
  const userId = user?.id ?? undefined;

  const { currentPlan, loadBillingData } = useBillingStore();
  useEffect(() => {
    if (userId && !currentPlan) void loadBillingData(userId);
  }, [userId, currentPlan, loadBillingData]);

  const isPremium = currentPlan ? currentPlan.plan !== 'free' : null;

  // Phase / conversation
  const [phase, setPhase] = useState<Phase>('lobby');
  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null);
  const [customCompany, setCustomCompany] = useState('');
  const [customRole, setCustomRole] = useState('');
  // Interview mode selection is intentionally fixed here and handled as AI Assistant flow.
  const selectedMode: InterviewMode = 'behavioral';
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [exchangeCount, setExchangeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [adaptiveInsights, setAdaptiveInsights] = useState<AdaptiveInsights | null>(null);

  // Per-turn feedback
  const [turnFeedback, setTurnFeedback] = useState<TurnFeedback | null>(null);

  // Post-session
  const [sessionNotes, setSessionNotes] = useState('');
  const [showNotesSaved, setShowNotesSaved] = useState(false);

  // Recording
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  // VAD (Voice Activity Detection)
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const [vadCountdown, setVadCountdown] = useState<number | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Mic level
  const animFrameRef = useRef<number>(0);
  const [micLevels, setMicLevels] = useState<number[]>([0.1, 0.2, 0.1, 0.2, 0.1]);

  // Call timer
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Transcript toggle (for complete screen)
  const [showTranscript, setShowTranscript] = useState(false);
  const interviewShell = PRACTICE_MODULE_CONFIGS.interview;
  const [selectedInterviewModeId] = useState(interviewShell.modes[1]?.id ?? interviewShell.modes[0]?.id ?? 'lite');
  const selectedInterviewMode = interviewShell.modes.find((mode) => mode.id === selectedInterviewModeId) ?? interviewShell.modes[0];

  // Live Interview engine state
  const [useLiveMode, setUseLiveMode] = useState(true);
  const liveSessionIdRef = useRef<string | null>(null);
  const [liveInterviewSummary, setLiveInterviewSummary] = useState<LiveInterviewSummary | null>(null);

  // Jobs feed
  const feedQuery = api.jobs.getFeed.useQuery({ limit: 20 }, { enabled: phase === 'lobby' });

  // Feedback auto-dismiss timer
  useEffect(() => {
    if (!turnFeedback) return;
    const t = setTimeout(() => setTurnFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [turnFeedback]);

  // Auto-start recording when it's the user's turn (ref filled in after startRecording is defined)
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  // ── Camera setup / teardown ────────────────────────────────────────────────

  const startCamera = useCallback(async (targetRef: React.RefObject<HTMLVideoElement | null>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      if (targetRef.current) {
        targetRef.current.srcObject = stream;
        await targetRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    setCameraActive(false);
  }, []);

  // Never auto-start camera in lobby.
  // Camera must start only after explicit user action (Start Interview).
  useEffect(() => {
    if (phase === 'lobby') {
      stopCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Call: move existing stream to call video ref when transitioning into call.
  // Do not request camera permissions here.
  useEffect(() => {
    if (phase === 'ai-speaking' || phase === 'user-turn' || phase === 'processing') {
      if (cameraStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        void videoRef.current.play();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Toggle camera on/off during call
  const toggleCamera = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  }, []);

  // ── Call timer ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'ai-speaking' || phase === 'user-turn' || phase === 'processing') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      }
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Mic level animation ────────────────────────────────────────────────────

  const startMicLevelAnimation = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const chunk = Math.floor(data.length / 5);
      const levels = Array.from({ length: 5 }, (_, i) => {
        const slice = data.slice(i * chunk, (i + 1) * chunk);
        const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
        return avg / 255;
      });
      setMicLevels(levels);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopMicLevelAnimation = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setMicLevels([0.1, 0.2, 0.1, 0.2, 0.1]);
  }, []);

  // ── Core conversation flow ─────────────────────────────────────────────────

  const getJob = useCallback((): JobOption => {
    if (selectedJob) return selectedJob;
    return {
      id: 'custom',
      title: customRole || 'Software Engineer',
      company: customCompany || 'Company',
      description: undefined,
    };
  }, [selectedJob, customCompany, customRole]);

  const runAITurn = useCallback(
    async (msgs: Message[]) => {
      const job = getJob();
      setPhase('ai-speaking');
      setAvatarState('speaking');
      setCurrentTranscript('');
      setError(null);

      let aiText = '';
      try {
        aiText = await streamAIResponse(
          msgs,
          { title: job.title, company: job.company, description: job.description ?? undefined },
          (text) => setCurrentTranscript(text),
          (insights) => setAdaptiveInsights(insights),
          userId,
          selectedMode,
        );
      } catch {
        setError('Something went wrong. Please try again.');
        setAvatarState('idle');
        setPhase('user-turn');
        return;
      }

      const updated: Message[] = [...msgs, { role: 'assistant', content: aiText }];
      setMessages(updated);
      setCurrentTranscript('');

      await playTTS(aiText);

      const newExchangeCount = updated.filter((m) => m.role === 'assistant').length;
      setExchangeCount(newExchangeCount);

      if (newExchangeCount >= MAX_EXCHANGES) {
        setPhase('complete');
        setAvatarState('idle');
        stopCamera();
      } else {
        setPhase('user-turn');
        setAvatarState('listening');
      }
    },
    [getJob, userId, stopCamera, selectedMode],
  );

  const joinCall = useCallback(async () => {
    // Explicit user action point: request camera only when Start Interview is clicked.
    await startCamera(lobbyVideoRef);
    setMessages([]);
    setExchangeCount(0);
    setCallSeconds(0);
    setError(null);
    setTurnFeedback(null);
    setSessionNotes('');
    setShowNotesSaved(false);
    setLiveInterviewSummary(null);
    liveSessionIdRef.current = null;
    setPhase('connecting');
    setAvatarState('thinking');
    await new Promise((r) => setTimeout(r, 1800));

    if (useLiveMode) {
      // ── Live Interview engine path ──────────────────────────────────────────
      const job = getJob();
      try {
        const { sessionId } = await trpcClient.liveInterview.createSession.mutate({
          mode: selectedMode as 'behavioral' | 'technical' | 'general' | 'hr' | 'case-study' | 'language-check',
          roleContext: {
            targetRole: job.title,
            company: job.company,
            description: job.description ?? undefined,
          },
        });
        liveSessionIdRef.current = sessionId;

        const { assistantMessage } = await trpcClient.liveInterview.startSession.mutate({ sessionId });
        const firstMsg: Message = { role: 'assistant', content: assistantMessage };
        setMessages([firstMsg]);
        setCurrentTranscript('');
        setPhase('ai-speaking');
        setAvatarState('speaking');
        await playTTS(assistantMessage);
        setExchangeCount(1);
        setPhase('user-turn');
        setAvatarState('listening');
      } catch {
        setError('Could not start the interview session. Please try again.');
        setAvatarState('idle');
        setPhase('lobby');
      }
    } else {
      // ── Coaching mode (legacy stream path) ─────────────────────────────────
      await runAITurn([]);
    }
  }, [runAITurn, useLiveMode, getJob, selectedMode, startCamera]);

  const startRecording = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicDenied(true);
      setError('Microphone access denied. Please allow mic access.');
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    startMicLevelAnimation(analyser);

    // ── Voice Activity Detection ───────────────────────────────────────────
    const VAD_SILENCE_THRESHOLD = 0.04; // RMS below this = silence
    const VAD_MIN_RECORDING_MS = 1200;  // don't trigger VAD for first 1.2s
    const VAD_SILENCE_MS = 2000;        // 2s of silence → auto-stop
    recordingStartTimeRef.current = Date.now();
    silenceStartRef.current = null;
    setVadCountdown(null);

    vadIntervalRef.current = setInterval(() => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length) / 255;
      const elapsed = Date.now() - recordingStartTimeRef.current;
      if (elapsed < VAD_MIN_RECORDING_MS) return;

      if (rms < VAD_SILENCE_THRESHOLD) {
        if (!silenceStartRef.current) silenceStartRef.current = Date.now();
        const silent = Date.now() - silenceStartRef.current;
        const countdown = Math.ceil((VAD_SILENCE_MS - silent) / 1000);
        setVadCountdown(countdown > 0 ? countdown : 1);
        if (silent >= VAD_SILENCE_MS) {
          recorderRef.current?.stop();
        }
      } else {
        silenceStartRef.current = null;
        setVadCountdown(null);
      }
    }, 100);

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      stopMicLevelAnimation();
      if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
      silenceStartRef.current = null;
      setVadCountdown(null);

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setPhase('processing');
      setAvatarState('thinking');
      setIsRecording(false);

      const transcript = await transcribeAudio(blob);
      if (!transcript.trim()) {
        setError("Couldn't hear you — please try again.");
        setPhase('user-turn');
        setAvatarState('listening');
        return;
      }

      // Show instant per-turn feedback
      const feedback = scoreTurnClient(transcript);
      setTurnFeedback(feedback);

      const updatedMsgs: Message[] = [
        ...messages,
        { role: 'user', content: transcript },
      ];
      setMessages(updatedMsgs);

      if (useLiveMode && liveSessionIdRef.current) {
        // ── Live Interview engine path ────────────────────────────────────────
        setPhase('processing');
        setAvatarState('thinking');
        try {
          const result = await trpcClient.liveInterview.respond.mutate({
            sessionId: liveSessionIdRef.current,
            userMessage: transcript,
          });

          const aiMsg: Message = { role: 'assistant', content: result.assistantMessage };
          const withAi: Message[] = [...updatedMsgs, aiMsg];
          setMessages(withAi);
          setExchangeCount(withAi.filter((m) => m.role === 'assistant').length);

          setPhase('ai-speaking');
          setAvatarState('speaking');
          await playTTS(result.assistantMessage);

          if (result.isComplete) {
            if (result.summary) setLiveInterviewSummary(result.summary as LiveInterviewSummary);
            setPhase('complete');
            setAvatarState('idle');
            stopCamera();
          } else {
            setPhase('user-turn');
            setAvatarState('listening');
          }
        } catch {
          setError('Something went wrong. Please try again.');
          setAvatarState('idle');
          setPhase('user-turn');
        }
      } else {
        // ── Coaching mode (legacy stream path) ───────────────────────────────
        await runAITurn(updatedMsgs);
      }
    };

    recorder.start(250);
    recorderRef.current = recorder;
    setIsRecording(true);
    setAvatarState('listening');
    setPhase('user-turn');
  }, [messages, runAITurn, useLiveMode, stopCamera, startMicLevelAnimation, stopMicLevelAnimation]);

  const stopRecording = useCallback(() => {
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    silenceStartRef.current = null;
    setVadCountdown(null);
    recorderRef.current?.stop();
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Keep ref always pointing to latest startRecording
  startRecordingRef.current = startRecording;

  // Auto-start recording when it's the user's turn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase === 'user-turn') {
      const t = setTimeout(() => void startRecordingRef.current?.(), 400);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const endCall = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
    stopMicLevelAnimation();
    stopCamera();

    if (useLiveMode && liveSessionIdRef.current) {
      const sessionId = liveSessionIdRef.current;
      void trpcClient.liveInterview.complete.mutate({ sessionId }).then((res) => {
        if (res.summary) setLiveInterviewSummary(res.summary as LiveInterviewSummary);
      }).catch(() => {
        // non-fatal — show complete screen without AI summary
      });
    }

    setPhase('complete');
    setAvatarState('idle');
  }, [useLiveMode, stopMicLevelAnimation, stopCamera]);

  const resetAll = useCallback(() => {
    setPhase('lobby');
    setSelectedJob(null);
    setCustomCompany('');
    setCustomRole('');
    setMessages([]);
    setCurrentTranscript('');
    setExchangeCount(0);
    setCallSeconds(0);
    setError(null);
    setAvatarState('idle');
    setIsRecording(false);
    setAdaptiveInsights(null);
    setShowTranscript(false);
    setTurnFeedback(null);
    setSessionNotes('');
    setShowNotesSaved(false);
    setLiveInterviewSummary(null);
    liveSessionIdRef.current = null;
  }, []);

  // ── LOBBY SCREEN ───────────────────────────────────────────────────────────

  if (phase === 'lobby') {
    const job = getJob();
    const canJoin = (selectedJob !== null) || (customCompany.trim() !== '' && customRole.trim() !== '');

    return (
      <div style={{ minHeight: '100vh', background: '#050a14', color: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <style>{AVATAR_STYLES}</style>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 880, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Left: camera preview tile */}
          <div style={{ flex: '1 1 340px', minHeight: 320, background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* actual video */}
            <video
              ref={lobbyVideoRef}
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', position: 'absolute', inset: 0 }}
            />
            {!cameraActive && (
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
                <span style={{ fontSize: 13, color: '#64748b' }}>Camera unavailable</span>
              </div>
            )}
            {/* "You" label */}
            <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#e2e8f0', zIndex: 2 }}>
              You
            </div>
            {/* Camera indicator */}
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, width: 10, height: 10, borderRadius: '50%', background: cameraActive ? '#22c55e' : '#64748b', boxShadow: cameraActive ? '0 0 8px #22c55e' : 'none' }} />
          </div>

          {/* Right: job selector + join */}
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase style={{ width: 22, height: 22, color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Interview Practice</h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Run dedicated interview sessions and get structured interview feedback.</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                  GPT-4o · online
                </p>
              </div>
            </div>

            <SupportingMaterialsDisclaimer compact collapsible defaultExpanded={false} className="mt-2" />

            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              <PracticeHeroHeader hero={interviewShell.hero} />
              <PracticeCostCard cost={selectedInterviewMode.cost} />
              <EstimatedSpendInlineNotice cost={selectedInterviewMode.cost} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PracticeProgressBadge label="Mode" value={selectedInterviewMode.title} />
                <PracticeProgressBadge label="Session" value="Voice" />
              </div>
            </div>

            {/* Custom role */}
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 10 }}>CUSTOM ROLE</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Company name"
                  value={customCompany}
                  onChange={(e) => { setCustomCompany(e.target.value); setSelectedJob(null); }}
                  style={{ flex: 1, background: '#050a14', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Job title"
                  value={customRole}
                  onChange={(e) => { setCustomRole(e.target.value); setSelectedJob(null); }}
                  style={{ flex: 1, background: '#050a14', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 8 }}>WHERE TO PICK INTERVIEW STYLE</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                This page is the <strong style={{ color: '#e2e8f0' }}>dedicated voice interview practice area</strong> (use <strong style={{ color: '#e2e8f0' }}>Live Interview</strong> vs <strong style={{ color: '#e2e8f0' }}>Feedback Mode</strong> below). There is no behavioural/technical mode menu here — the voice session uses a fixed behavioural-style interviewer prompt in code.
              </p>
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#94a3b8', lineHeight: 1.55 }}>
                <li>
                  <strong style={{ color: '#e2e8f0' }}>AI Career Assistant</strong> — set reply mode to <strong style={{ color: '#e2e8f0' }}>Interview</strong> (right column on large screens) or tap <strong style={{ color: '#e2e8f0' }}>Interview Prep</strong> in topics:{' '}
                  <Link to="/assistant" style={{ color: '#a5b4fc', fontWeight: 600 }}>Open Assistant →</Link>
                </li>
                <li style={{ marginTop: 6 }}>
                  <strong style={{ color: '#e2e8f0' }}>Daily Warmup</strong> — short timed drills with category choice:{' '}
                  <Link to="/warmup" style={{ color: '#a5b4fc', fontWeight: 600 }}>Open Warmup →</Link>
                </li>
              </ul>
            </div>

            {/* Jobs list */}
            {feedQuery.isLoading ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '12px 0' }}>
                <div style={{ width: 18, height: 18, border: '2px solid #6366f1', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 6px' }} />
                Loading jobs…
              </div>
            ) : feedQuery.data && feedQuery.data.length > 0 ? (
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 10 }}>OR PICK A JOB</p>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {feedQuery.data.map((j: { id: string; title: string; company: string; description?: string | null; location?: string | null }) => (
                    <button
                      key={j.id}
                      onClick={() => { setSelectedJob({ id: j.id, title: j.title, company: j.company, description: j.description }); setCustomCompany(''); setCustomRole(''); }}
                      style={{ background: selectedJob?.id === j.id ? 'rgba(99,102,241,0.2)' : '#050a14', border: `1px solid ${selectedJob?.id === j.id ? '#6366f1' : '#1e293b'}`, borderRadius: 8, padding: '9px 14px', textAlign: 'left', cursor: 'pointer', color: '#f1f5f9', transition: 'all 0.15s' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{j.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{j.company}{j.location ? ` · ${j.location}` : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isPremium === false ? (
              <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(59,130,246,0.12))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 14, padding: '20px 20px', textAlign: 'center' }}>
                <Lock style={{ width: 28, height: 28, color: '#a5b4fc', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0', marginBottom: 6 }}>AI Interview Practice is a Pro feature</p>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Upgrade to Pro or Autopilot to unlock unlimited mock interviews and coaching plans.</p>
                <Link
                  to="/billing"
                  style={{ display: 'inline-block', padding: '10px 28px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                >
                  Upgrade to Pro →
                </Link>
              </div>
            ) : (
            <>
            {/* Mode toggle: Live Interview vs Coaching */}
            <div style={{ background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b', padding: '8px', display: 'flex', gap: 4 }}>
              <button
                onClick={() => setUseLiveMode(true)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  background: useLiveMode ? 'linear-gradient(135deg,#6366f1,#3b82f6)' : 'transparent',
                  color: useLiveMode ? '#fff' : '#64748b',
                  transition: 'all 0.15s',
                }}
              >
                🎙️ Live Interview
              </button>
              <button
                onClick={() => setUseLiveMode(false)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  background: !useLiveMode ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: !useLiveMode ? '#a5b4fc' : '#64748b',
                  transition: 'all 0.15s',
                }}
              >
                🧑‍🏫 Coaching Mode
              </button>
            </div>
            {useLiveMode && (
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                Real interview flow — structured questions, follow-ups, session memory, and summary
              </p>
            )}

            {/* Join button */}
            <button
              disabled={!canJoin}
              onClick={() => void joinCall()}
              style={{
                padding: '14px 0',
                background: canJoin ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#1e293b',
                border: 'none',
                borderRadius: 12,
                color: canJoin ? '#fff' : '#475569',
                fontWeight: 700,
                fontSize: 16,
                cursor: canJoin ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {canJoin ? `📞 Join Interview — ${job.title} at ${job.company}` : 'Select a job or enter a custom role'}
            </button>
            </>
            )}

            <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: '#475569' }}>
              Session history and question bank are disabled here.
            </p>
          </div>
        </div>
        </div>

        {currentPlan && (
          <div style={{ flexShrink: 0, width: '100%', padding: '12px 24px 20px', borderTop: '1px solid rgba(30,41,59,0.9)', background: 'rgba(5,10,20,0.95)' }}>
            <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 12, padding: '10px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Zap style={{ width: 16, height: 16, color: '#818cf8', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>AI credits remaining:</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{currentPlan.credits.toLocaleString()}</span>
              </div>
              <Link
                to="/billing"
                style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc', textDecoration: 'none', padding: '5px 12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 8 }}
              >
                Buy credits / Billing →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CONNECTING SCREEN ──────────────────────────────────────────────────────

  if (phase === 'connecting') {
    const job = getJob();
    return (
      <div style={{ minHeight: '100vh', background: '#050a14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <style>{AVATAR_STYLES}</style>
        <Avatar state="thinking" />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Connecting…</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>{job.title} at {job.company}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 150, 300].map((d, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366f1', animation: 'bounce-dot 0.9s ease-in-out infinite', animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── COMPLETE / SUMMARY SCREEN ──────────────────────────────────────────────

  if (phase === 'complete') {
    const job = getJob();
    const modeInfo = interviewModeLabels[selectedMode];
    const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);
    const coachingPlan = generateCoachingPlan(userMessages);
    const avgScore = userMessages.length > 0
      ? Math.round(userMessages.reduce((acc, t) => acc + scoreTurnClient(t).score, 0) / userMessages.length)
      : null;
    const scoreColor = avgScore === null ? '#64748b' : avgScore >= 80 ? '#34d399' : avgScore >= 60 ? '#fbbf24' : '#f87171';

    const handleExport = () => {
      const md = generateMarkdownReport({ job, mode: selectedMode, messages, callSeconds, exchangeCount, notes: sessionNotes, modeLabel: modeInfo.label });
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = job.company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'company';
      a.download = `interview-report-${safeName}-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const handleSaveNotes = () => {
      setShowNotesSaved(true);
      setTimeout(() => setShowNotesSaved(false), 2500);
    };

    return (
      <div style={{ minHeight: '100vh', background: '#050a14', color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <style>{AVATAR_STYLES}</style>
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Summary header card */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎙️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Interview Complete</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 14px' }}>
              {modeInfo.emoji} {modeInfo.label} · {job.title} at {job.company}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor }}>{avgScore !== null ? `${avgScore}/100` : '—'}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Avg Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#a5b4fc' }}>{formatTime(callSeconds)}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Duration</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399' }}>{exchangeCount}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Exchanges</div>
              </div>
            </div>
            {adaptiveInsights && adaptiveInsights.sessionCount > 0 && (
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#a5b4fc' }}>
                <TrendingUp style={{ width: 12, height: 12 }} />
                Session #{adaptiveInsights.sessionCount + 1} · Historical avg: {adaptiveInsights.averageScore}/100
              </div>
            )}
          </div>

          {/* Live Interview Summary (when live mode was used) */}
          {useLiveMode && liveInterviewSummary && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>🎙️</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Interview Summary</span>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{liveInterviewSummary.summary}</p>
              {liveInterviewSummary.strengths.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', marginBottom: 6 }}>STRENGTHS</div>
                  {liveInterviewSummary.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ color: '#34d399', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {liveInterviewSummary.weaknesses.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: '0.08em', marginBottom: 6 }}>AREAS TO IMPROVE</div>
                  {liveInterviewSummary.weaknesses.map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ color: '#f87171', flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              {liveInterviewSummary.nextFocus.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em', marginBottom: 6 }}>NEXT PRACTICE FOCUS</div>
                  {liveInterviewSummary.nextFocus.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ color: '#fbbf24', flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {liveInterviewSummary.communicationNotes && (
                <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>{liveInterviewSummary.communicationNotes}</p>
              )}
            </div>
          )}

          {/* Coaching Plan (shown only in coaching mode) */}
          {!useLiveMode && coachingPlan.length > 0 && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Star style={{ width: 16, height: 16, color: '#fbbf24' }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Your Coaching Plan</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coachingPlan.map((item, i) => {
                  const priorityColor = item.priority === 'high' ? '#f87171' : item.priority === 'medium' ? '#fbbf24' : '#34d399';
                  return (
                    <div key={i} style={{ background: '#050a14', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: priorityColor, background: `${priorityColor}20`, borderRadius: 4, padding: '2px 7px', letterSpacing: '0.05em' }}>{item.priority.toUpperCase()}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{item.area}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{item.action}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transcript toggle */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden' }}>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              <span>📝 Full conversation transcript</span>
              {showTranscript ? <ChevronUp style={{ width: 16, height: 16, color: '#64748b' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#64748b' }} />}
            </button>
            {showTranscript && (
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, fontSize: 18 }}>{msg.role === 'assistant' ? '🤖' : '👤'}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: msg.role === 'assistant' ? '#818cf8' : '#34d399', marginBottom: 3, letterSpacing: '0.05em' }}>
                        {msg.role === 'assistant' ? 'INTERVIEWER' : 'YOU'}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Notes */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <StickyNote style={{ width: 15, height: 15, color: '#fbbf24' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Session Notes</span>
              {showNotesSaved && <span style={{ fontSize: 11, color: '#34d399', marginLeft: 'auto' }}>✓ Saved</span>}
            </div>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Add your own observations, things to remember, follow-up actions…"
              rows={4}
              style={{ width: '100%', background: '#050a14', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
            <button
              onClick={handleSaveNotes}
              style={{ marginTop: 8, padding: '7px 18px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Save Notes
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => void joinCall()}
              style={{ flex: '1 1 160px', padding: '13px 0', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} /> Practice Again
            </button>
            <button
              onClick={handleExport}
              style={{ flex: '1 1 160px', padding: '13px 0', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#94a3b8', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <FileDown style={{ width: 16, height: 16 }} /> Export Report
            </button>
            <button
              onClick={resetAll}
              style={{ flex: '1 1 160px', padding: '13px 0', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#cbd5e1', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Briefcase style={{ width: 16, height: 16 }} /> Change Role
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── CALL SCREEN (main video-call layout) ────────────────────────────────────

  const job = getJob();
  const userTurnActive = phase === 'user-turn';
  const statusLabel =
    phase === 'ai-speaking' ? 'Speaking' :
    phase === 'processing' ? 'Thinking…' :
    phase === 'user-turn' ? 'Listening' : 'Ready';
  const statusColor =
    phase === 'ai-speaking' ? '#818cf8' :
    phase === 'processing' ? '#fbbf24' :
    phase === 'user-turn' ? '#4ade80' : '#94a3b8';
  const statusBg =
    isRecording ? 'rgba(239,68,68,0.2)' :
    phase === 'ai-speaking' ? 'rgba(99,102,241,0.2)' :
    phase === 'processing' ? 'rgba(251,191,36,0.2)' :
    phase === 'user-turn' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.15)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050a14',
        color: '#f1f5f9',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <style>{AVATAR_STYLES}</style>

      {/* ── AI Tile (fills entire screen) ───────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 56,
          paddingBottom: 120,
          boxSizing: 'border-box',
          background: 'radial-gradient(ellipse at 50% 40%, #0d1a2e 0%, #050a14 100%)',
        }}
      >
        {/* Avatar */}
        <Avatar state={avatarState} />

        {/* Recording indicator — prominent pulsing bar */}
        {isRecording && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {/* Wave bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
              {micLevels.map((level, i) => (
                <div key={i} style={{
                  width: 5,
                  height: Math.max(6, level * 32),
                  borderRadius: 3,
                  background: vadCountdown !== null ? '#f59e0b' : '#ef4444',
                  transition: 'height 0.08s ease, background 0.2s',
                  opacity: 0.9,
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: vadCountdown !== null ? '#f59e0b' : '#f87171', fontWeight: 600, letterSpacing: 1 }}>
              {vadCountdown !== null ? `Finishing in ${vadCountdown}s…` : 'Recording — speak freely'}
            </div>
          </div>
        )}

        {/* Adaptive insights chip */}
        {adaptiveInsights && adaptiveInsights.sessionCount > 0 && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#a5b4fc' }} title={adaptiveInsights.adaptationNote ?? ''}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
            Adapting · Avg {adaptiveInsights.averageScore}/100
          </div>
        )}
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          rowGap: 8,
          background: 'linear-gradient(to bottom, rgba(5,10,20,0.95), transparent)',
          zIndex: 10,
        }}
      >
        {/* Recording dot + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 12px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'ping-dot 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#f1f5f9' }}>{formatTime(callSeconds)}</span>
        </div>

        {/* Job info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.2 }}>{job.title}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{job.company}</div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{ background: statusBg, border: `1px solid ${statusColor}33`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: statusColor }}>
          {statusLabel}
        </div>

        {/* Mode badge */}
        <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
          {interviewModeLabels[selectedMode].emoji} {interviewModeLabels[selectedMode].label}
        </div>

        {/* Exchange counter */}
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {exchangeCount}/{MAX_EXCHANGES}
        </div>
      </div>

      {/* ── Subtitle area (live transcript) ─────────────────────────────────── */}
      {(currentTranscript || phase === 'processing') && (
        <div
          style={{
            position: 'absolute',
            bottom: 'max(100px, env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 640,
            width: 'min(640px, calc(100% - 32px))',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 16,
              lineHeight: 1.6,
              color: '#f1f5f9',
              maxWidth: '100%',
            }}
          >
            {phase === 'processing'
              ? <span style={{ color: '#94a3b8' }}>Processing your answer…</span>
              : currentTranscript}
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div style={{ position: 'absolute', top: 70, right: 20, zIndex: 20, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#fca5a5', maxWidth: 320 }}>
          {error}
        </div>
      )}

      {/* Per-turn feedback overlay */}
      {turnFeedback && (
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            background: 'rgba(15,23,42,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 16,
            padding: '14px 20px',
            width: 340,
            maxWidth: 'min(340px, calc(100vw - 24px))',
            animation: 'slide-up 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.05em' }}>⚡ INSTANT FEEDBACK</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: turnFeedback.score >= 80 ? '#34d399' : turnFeedback.score >= 60 ? '#fbbf24' : '#f87171' }}>{turnFeedback.score}/100</span>
          </div>
          {/* STAR indicators */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
            {(['situation', 'task', 'action', 'result'] as const).map((k) => (
              <span key={k} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '3px 0', borderRadius: 5, background: turnFeedback.starPresence[k] ? 'rgba(52,211,153,0.2)' : 'rgba(100,116,139,0.15)', color: turnFeedback.starPresence[k] ? '#34d399' : '#475569', letterSpacing: '0.04em' }}>
                {k[0].toUpperCase()}
              </span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{turnFeedback.improvementTip}</p>
        </div>
      )}

      {/* ── User PiP (bottom-right) ──────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'max(108px, calc(88px + env(safe-area-inset-bottom, 0px)))',
          right: 'max(12px, env(safe-area-inset-right, 0px))',
          width: 'min(200px, 42vw)',
          aspectRatio: '4 / 3',
          height: 'auto',
          maxHeight: '28vh',
          borderRadius: 14,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.12)',
          background: '#0f172a',
          zIndex: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {cameraActive && cameraOn ? (
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 32 }}>👤</div>
            <span style={{ fontSize: 11, color: '#475569' }}>{!cameraOn ? 'Camera off' : 'No camera'}</span>
          </div>
        )}

        {/* "You" label */}
        <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>
          You
        </div>

        {/* Mic level overlay when recording */}
        {isRecording && (
          <div style={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            <MicLevelBars levels={micLevels} />
          </div>
        )}

        {/* Mic denied badge */}
        {micDenied && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(239,68,68,0.9)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 600 }}>
            MIC ✗
          </div>
        )}
      </div>

      {/* ── Floating controls bar ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 'calc(100vw - 24px)',
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '10px 16px',
          zIndex: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Camera toggle */}
        <button
          onClick={toggleCamera}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: cameraOn ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${cameraOn ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: cameraOn ? '#818cf8' : '#f87171',
            transition: 'all 0.2s',
          }}
        >
          {cameraOn ? <Video style={{ width: 18, height: 18 }} /> : <VideoOff style={{ width: 18, height: 18 }} />}
        </button>

        {/* Mic / Speak button (main action) */}
        <button
          disabled={!userTurnActive && !isRecording}
          onClick={toggleRecording}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: isRecording
              ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
              : userTurnActive
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : '#1e293b',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: userTurnActive || isRecording ? 'pointer' : 'not-allowed',
            color: userTurnActive || isRecording ? '#fff' : '#475569',
            transition: 'all 0.2s',
            boxShadow: isRecording ? '0 0 24px rgba(220,38,38,0.5)' : userTurnActive ? '0 0 24px rgba(34,197,94,0.4)' : 'none',
          }}
          title={isRecording ? 'Stop speaking' : userTurnActive ? 'Start speaking' : 'Wait for your turn'}
        >
          {isRecording
            ? <MicOff style={{ width: 24, height: 24 }} />
            : <Mic style={{ width: 24, height: 24 }} />}
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => setMicMuted((v) => !v)}
          title={micMuted ? 'Unmute' : 'Mute'}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: micMuted ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)',
            border: `1px solid ${micMuted ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: micMuted ? '#f87171' : '#818cf8',
            transition: 'all 0.2s',
          }}
        >
          {micMuted ? <MicOff style={{ width: 18, height: 18 }} /> : <Mic style={{ width: 18, height: 18 }} />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

        {/* End call button */}
        <button
          onClick={endCall}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
          }}
          title="End interview"
        >
          <PhoneOff style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Label under mic button */}
      <div
        style={{
          position: 'absolute',
          bottom: 'max(4px, env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          textAlign: 'center',
          maxWidth: 'min(100vw - 24px, 280px)',
          zIndex: 20,
          color: isRecording ? '#f87171' : '#475569',
        }}
      >
        {isRecording ? 'Tap to stop early' : userTurnActive ? 'Starting mic…' : statusLabel}
      </div>
    </div>
  );
}
