import { useRef, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { Mic, MicOff, PhoneOff, RefreshCw, Briefcase } from 'lucide-react';

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
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'job-select'
  | 'idle'
  | 'ai-speaking'
  | 'user-turn'
  | 'processing'
  | 'complete';

type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const MAX_EXCHANGES = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function streamAIResponse(
  messages: Array<{ role: string; content: string }>,
  job: { title: string; company: string; description?: string },
  onChunk: (fullText: string) => void,
  onInsights: (insights: AdaptiveInsights) => void,
  userId?: string,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/interview/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, job, userId: userId ?? undefined }),
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
    const response = await fetch(`${API_BASE}/api/interview/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      credentials: 'include',
    });
    if (!response.ok) return;
    const blob = await response.blob();
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
    const res = await fetch(`${API_BASE}/api/interview/transcribe`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    if (!res.ok) return '';
    const json = (await res.json()) as { transcript?: string };
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

  return (
    <div
      className="relative"
      style={{
        width: 160,
        height: 160,
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
        style={{ width: 160, height: 160, borderRadius: '50%', animation: faceAnimation, display: 'block' }}
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

  // Phase / conversation
  const [phase, setPhase] = useState<Phase>('job-select');
  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null);
  const [customCompany, setCustomCompany] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [exchangeCount, setExchangeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [adaptiveInsights, setAdaptiveInsights] = useState<AdaptiveInsights | null>(null);

  // Recording
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [micDenied, setMicDenied] = useState(false);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Mic level
  const animFrameRef = useRef<number>(0);
  const [micLevels, setMicLevels] = useState<number[]>([0.1, 0.2, 0.1, 0.2, 0.1]);

  // Conversation log scroll
  const logRef = useRef<HTMLDivElement>(null);

  // Jobs feed
  const feedQuery = api.jobs.getFeed.useQuery({ limit: 20 }, { enabled: phase === 'job-select' });

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  // Camera setup
  useEffect(() => {
    if (phase === 'job-select') return;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch {
        setCameraActive(false);
      }
    })();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setCameraActive(false);
    };
  }, [phase]);

  // Mic level animation
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

  // ── Core conversation flow ──────────────────────────────────────────────────

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
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        setError(`AI error: ${msg}`);
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
      } else {
        setPhase('user-turn');
        setAvatarState('listening');
      }
    },
    [getJob, userId],
  );

  const startInterview = useCallback(async () => {
    setMessages([]);
    setExchangeCount(0);
    setError(null);
    setPhase('idle');
    setAvatarState('thinking');
    await runAITurn([]);
  }, [runAITurn]);

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

    // Set up analyser for level visualisation
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    startMicLevelAnimation(analyser);

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      stopMicLevelAnimation();

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

      const updatedMsgs: Message[] = [
        ...messages,
        { role: 'user', content: transcript },
      ];
      setMessages(updatedMsgs);
      await runAITurn(updatedMsgs);
    };

    recorder.start(250);
    recorderRef.current = recorder;
    setIsRecording(true);
    setAvatarState('listening');
    setPhase('user-turn');
  }, [messages, runAITurn, startMicLevelAnimation, stopMicLevelAnimation]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const endInterview = useCallback(() => {
    recorderRef.current?.stop();
    setPhase('complete');
    setAvatarState('idle');
    setIsRecording(false);
    stopMicLevelAnimation();
  }, [stopMicLevelAnimation]);

  const resetAll = useCallback(() => {
    setPhase('job-select');
    setSelectedJob(null);
    setCustomCompany('');
    setCustomRole('');
    setMessages([]);
    setCurrentTranscript('');
    setExchangeCount(0);
    setError(null);
    setAvatarState('idle');
    setIsRecording(false);
    setAdaptiveInsights(null);
  }, []);

  // ── Job-select screen ──────────────────────────────────────────────────────

  if (phase === 'job-select') {
    const job = getJob();
    const canStart = (selectedJob !== null) || (customCompany.trim() !== '' && customRole.trim() !== '');

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#0a0f1e' }}
      >
        <style>{AVATAR_STYLES}</style>

        <div
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 560,
            color: '#f9fafb',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>AI Interview Practice</h1>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Video-call style with a live AI interviewer</p>
            </div>
          </div>

          {/* Custom job */}
          <div
            style={{
              background: '#1f2937',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10, fontWeight: 600 }}>CUSTOM ROLE</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Company name"
                value={customCompany}
                onChange={(e) => { setCustomCompany(e.target.value); setSelectedJob(null); }}
                style={{
                  flex: 1,
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#f9fafb',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Job title"
                value={customRole}
                onChange={(e) => { setCustomRole(e.target.value); setSelectedJob(null); }}
                style={{
                  flex: 1,
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#f9fafb',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Jobs from feed */}
          {feedQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: 14 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #6366f1',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 8px',
                }}
              />
              Loading jobs...
            </div>
          ) : feedQuery.data && feedQuery.data.length > 0 ? (
            <div>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: 600 }}>OR PICK A JOB</p>
              <div
                style={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {feedQuery.data.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => {
                      setSelectedJob({ id: j.id, title: j.title, company: j.company, description: j.description });
                      setCustomCompany('');
                      setCustomRole('');
                    }}
                    style={{
                      background: selectedJob?.id === j.id ? 'rgba(99,102,241,0.2)' : '#1f2937',
                      border: `1px solid ${selectedJob?.id === j.id ? '#6366f1' : '#374151'}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#f9fafb',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{j.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{j.company} {j.location ? `· ${j.location}` : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            disabled={!canStart}
            onClick={() => void startInterview()}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '12px 0',
              background: canStart ? 'linear-gradient(135deg, #6366f1, #3b82f6)' : '#374151',
              border: 'none',
              borderRadius: 10,
              color: canStart ? '#fff' : '#6b7280',
              fontWeight: 700,
              fontSize: 15,
              cursor: canStart ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.15s',
            }}
          >
            {canStart
              ? `Start Interview — ${job.title} at ${job.company}`
              : 'Select a job or enter a custom role'}
          </button>
        </div>
      </div>
    );
  }

  // ── Complete screen ─────────────────────────────────────────────────────────

  if (phase === 'complete') {
    const lastAI = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#0a0f1e' }}
      >
        <div
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 16,
            padding: 40,
            width: '100%',
            maxWidth: 520,
            color: '#f9fafb',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Interview Complete!</h2>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>
            {exchangeCount} exchange{exchangeCount !== 1 ? 's' : ''} with your AI interviewer
          </p>
          {lastAI && (
            <div
              style={{
                background: '#1f2937',
                borderRadius: 10,
                padding: 16,
                textAlign: 'left',
                marginBottom: 24,
                fontSize: 14,
                lineHeight: 1.6,
                color: '#d1d5db',
              }}
            >
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>LAST MESSAGE</p>
              {lastAI}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => void startInterview()}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} /> Practice Again
            </button>
            <button
              onClick={resetAll}
              style={{
                flex: 1,
                padding: '12px 0',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 10,
                color: '#d1d5db',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Briefcase style={{ width: 16, height: 16 }} /> View Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Video call UI ───────────────────────────────────────────────────────────

  const job = getJob();
  const userTurnActive = phase === 'user-turn';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        color: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 16,
      }}
    >
      {/* Keyframes */}
      <style>{AVATAR_STYLES}</style>

      {/* Main panels row */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* AI Panel (left, ~60%) */}
        <div
          style={{
            flex: 3,
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 24,
            position: 'relative',
            minHeight: 360,
          }}
        >
          {/* Header */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Interviewing for {job.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{job.company}</div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                background:
                  phase === 'ai-speaking'
                    ? 'rgba(99,102,241,0.2)'
                    : phase === 'user-turn'
                    ? 'rgba(34,197,94,0.2)'
                    : 'rgba(107,114,128,0.2)',
                border: `1px solid ${
                  phase === 'ai-speaking' ? '#6366f1' : phase === 'user-turn' ? '#22c55e' : '#6b7280'
                }`,
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                color:
                  phase === 'ai-speaking' ? '#818cf8' : phase === 'user-turn' ? '#4ade80' : '#9ca3af',
              }}
            >
              {phase === 'ai-speaking'
                ? 'Speaking'
                : phase === 'processing'
                ? 'Thinking...'
                : phase === 'user-turn'
                ? 'Listening'
                : 'Ready'}
            </div>
          </div>

          {/* Avatar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Avatar state={avatarState} />

            {/* Adaptive insights badge */}
            {adaptiveInsights && adaptiveInsights.sessionCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  color: '#a5b4fc',
                  fontWeight: 500,
                }}
                title={adaptiveInsights.adaptationNote ?? ''}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', flexShrink: 0 }} />
                Adapting to your history{adaptiveInsights.averageScore > 0 ? ` • Avg score: ${adaptiveInsights.averageScore}/100` : ''}
              </div>
            )}

            {/* Live transcript */}
            {(currentTranscript || phase === 'processing') && (
              <div
                style={{
                  maxWidth: 380,
                  textAlign: 'center',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: '#e5e7eb',
                  minHeight: 60,
                  padding: '0 8px',
                }}
              >
                {phase === 'processing' ? (
                  <span style={{ color: '#9ca3af' }}>Processing your answer...</span>
                ) : (
                  currentTranscript
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Panel (right, ~40%) */}
        <div
          style={{
            flex: 2,
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 360,
          }}
        >
          {/* Camera */}
          <div
            style={{
              flex: 1,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '16px 16px 0 0',
            }}
          >
            {cameraActive ? (
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                  }}
                >
                  👤
                </div>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Camera unavailable</span>
              </div>
            )}
            {/* Mic level overlay */}
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MicLevelBars levels={micLevels} />
              </div>
            )}
          </div>

          {/* Status */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isRecording ? '#22c55e' : userTurnActive ? '#f59e0b' : '#374151',
                animation: isRecording ? 'ping-dot 0.8s ease-in-out infinite' : 'none',
              }}
            />
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
              {isRecording ? 'Recording...' : userTurnActive ? 'Your turn' : 'Waiting...'}
            </span>
            {micDenied && (
              <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 4 }}>Mic denied</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Conversation log */}
        <div
          ref={logRef}
          style={{
            maxHeight: 160,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingRight: 4,
          }}
        >
          {messages.length === 0 && (
            <p style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
              Conversation will appear here...
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '7px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.3)' : '#1f2937',
                  border: `1px solid ${msg.role === 'user' ? '#6366f1' : '#374151'}`,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#e5e7eb',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid #ef4444',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Exchange counter */}
          <span
            style={{
              fontSize: 12,
              color: '#6b7280',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {exchangeCount} / {MAX_EXCHANGES}
          </span>

          {/* Speak button */}
          <button
            disabled={!userTurnActive && !isRecording}
            onClick={toggleRecording}
            style={{
              flex: 1,
              padding: '12px 0',
              background: isRecording
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : userTurnActive
                ? 'linear-gradient(135deg, #6366f1, #3b82f6)'
                : '#1f2937',
              border: 'none',
              borderRadius: 10,
              color: userTurnActive || isRecording ? '#fff' : '#4b5563',
              fontWeight: 700,
              fontSize: 15,
              cursor: userTurnActive || isRecording ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
            }}
          >
            {isRecording ? (
              <>
                <MicOff style={{ width: 18, height: 18 }} />
                Stop Recording
              </>
            ) : (
              <>
                <Mic style={{ width: 18, height: 18 }} />
                {userTurnActive ? '🎤 Speak' : 'Waiting...'}
              </>
            )}
          </button>

          {/* End button */}
          <button
            onClick={endInterview}
            style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 10,
              color: '#f87171',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <PhoneOff style={{ width: 16, height: 16 }} />
            End
          </button>
        </div>
      </div>
    </div>
  );
}
