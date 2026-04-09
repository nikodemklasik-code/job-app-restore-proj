import { useRef, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Mic, MicOff, PhoneOff, RefreshCw, Briefcase } from 'lucide-react';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const MAX_EXCHANGES = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function streamAIResponse(
  messages: Array<{ role: string; content: string }>,
  job: { title: string; company: string; description?: string },
  onChunk: (fullText: string) => void,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/interview/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, job }),
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

// ─── Avatar Component ─────────────────────────────────────────────────────────

function Avatar({ state }: { state: AvatarState }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            state === 'listening'
              ? 'conic-gradient(from 0deg, #22c55e, #16a34a, #22c55e)'
              : 'conic-gradient(from 0deg, #6366f1, #3b82f6, #8b5cf6, #6366f1)',
          padding: 3,
          borderRadius: '50%',
          animation:
            state === 'idle' ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' :
            state === 'listening' ? 'ping-ring 1s ease-in-out infinite' : 'none',
        }}
      />
      {/* Inner circle */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 148,
          height: 148,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)',
          marginTop: 3,
          marginLeft: 3,
        }}
      >
        {state === 'speaking' && (
          <div className="flex items-end gap-1" style={{ height: 40 }}>
            {[0, 150, 300, 450, 600].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  background: 'linear-gradient(to top, #6366f1, #818cf8)',
                  borderRadius: 3,
                  animation: 'wave 0.8s ease-in-out infinite',
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
        )}
        {state === 'listening' && (
          <div className="flex items-center justify-center">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#22c55e',
                opacity: 0.8,
                animation: 'ping-dot 1s ease-in-out infinite',
              }}
            />
          </div>
        )}
        {state === 'thinking' && (
          <div className="flex gap-2">
            {[0, 200, 400].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#818cf8',
                  animation: 'bounce-dot 0.8s ease-in-out infinite',
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
        )}
        {state === 'idle' && (
          <span style={{ fontSize: 48 }}>🤖</span>
        )}
      </div>
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
    [getJob],
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
        <style>{`
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
        `}</style>

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
      <style>{`
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
      `}</style>

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
