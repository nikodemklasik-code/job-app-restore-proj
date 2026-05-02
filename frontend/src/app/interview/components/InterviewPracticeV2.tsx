/**
 * InterviewPracticeV2.tsx
 *
 * Enhanced interview practice component with realistic video call simulation.
 * Integrates with the live interview engine for AI-powered realistic interviews.
 *
 * Features:
 * - Full-screen video call UI (like Zoom/Teams)
 * - Real-time audio recording and transcription
 * - AI recruiter with adaptive questioning
 * - Interview stage progression
 * - Real-time feedback and coaching
 * - Session summary and report generation
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpcClient } from '@/lib/api';
import { VideoCallSimulator } from './VideoCallSimulator';
import type { InterviewStage, RecruiterPersona } from './VideoCallSimulator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InterviewSession {
  id: string;
  status: 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  stage: InterviewStage;
  turnCount: number;
  transcript: Array<{ speaker: 'assistant' | 'candidate'; message: string; timestamp: Date }>;
  memory: {
    askedQuestions: string[];
    claimsCaptured: string[];
    themesCovered: string[];
    positiveSignals: string[];
    negativeSignals: string[];
    openLoops: string[];
  };
}

interface InterviewPracticeV2Props {
  mode: 'behavioral' | 'technical' | 'general' | 'hr' | 'case-study' | 'language-check';
  recruiterPersona: RecruiterPersona;
  targetRole: string;
  company?: string;
  seniority?: string;
  maxTurns?: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InterviewPracticeV2({
  mode,
  recruiterPersona,
  targetRole,
  company,
  seniority,
  maxTurns = 12,
}: InterviewPracticeV2Props) {
  const { user } = useUser();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const processTurnRef = useRef<((userMessage: string) => Promise<void>) | null>(null);

  // ─── State ────────────────────────────────────────────────────────────────

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [phase, setPhase] = useState<'lobby' | 'connecting' | 'active' | 'completing' | 'completed'>('lobby');
  const [isRecruiterSpeaking, setIsRecruiterSpeaking] = useState(false);
  const [recruiterMessage, setRecruiterMessage] = useState('');
  const [candidateTranscript, setCandidateTranscript] = useState('');
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ─── Timer ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'active') return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // ─── Audio Recording Setup ────────────────────────────────────────────────

  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access denied. Please enable microphone permissions.');
    }
  }, []);

  const stopAudioRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    });
  }, []);

  // ─── Session Management ───────────────────────────────────────────────────

  const createSession = useCallback(async () => {
    if (!user) return;

    try {
      setPhase('connecting');
      const result = await trpcClient.liveInterview.createSession.mutate({
        mode,
        roleContext: {
          targetRole,
          company,
          seniority,
        },
        config: {
          maxTurns,
        },
      });

      setSession({
        id: result.sessionId,
        status: result.status as InterviewSession['status'],
        stage: result.stage as InterviewSession['stage'],
        turnCount: 0,
        transcript: [],
        memory: {
          askedQuestions: [],
          claimsCaptured: [],
          themesCovered: [],
          positiveSignals: [],
          negativeSignals: [],
          openLoops: [],
        },
      });
      setPhase('active');
      await startAudioRecording();

      // Start the interview
      const startResult = await trpcClient.liveInterview.startSession.mutate({
        sessionId: result.sessionId,
      });

      setRecruiterMessage(startResult.assistantMessage);
      setIsRecruiterSpeaking(true);

      // Play TTS if available
      await playRecruiterMessage(startResult.assistantMessage);
      setIsRecruiterSpeaking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setPhase('lobby');
    }
  }, [user, mode, targetRole, company, seniority, maxTurns, startAudioRecording]);

  const processTurn = useCallback(
    async (userMessage: string) => {
      if (!session) return;

      try {
        setIsProcessing(true);
        setCandidateTranscript(userMessage);
        setIsCandidateSpeaking(false);

        const result = await trpcClient.liveInterview.respond.mutate({
          sessionId: session.id,
          userMessage,
        });

        setRecruiterMessage(result.assistantMessage);
        setIsRecruiterSpeaking(true);

        // Play TTS
        await playRecruiterMessage(result.assistantMessage);
        setIsRecruiterSpeaking(false);

        // Check if interview is complete
        if (result.isComplete) {
          setPhase('completing');
          await completeSession();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process turn');
      } finally {
        setIsProcessing(false);
      }
    },
    [session]
  );

  // Keep ref up-to-date so callers (e.g. future speech-end events) can invoke it
  processTurnRef.current = processTurn;

  const completeSession = useCallback(async () => {
    if (!session) return;

    try {
      await stopAudioRecording();
      await trpcClient.liveInterview.complete.mutate({
        sessionId: session.id,
      });

      setPhase('completed');
      // TODO: Show summary and report
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
    }
  }, [session, stopAudioRecording]);

  const playRecruiterMessage = useCallback(async (message: string) => {
    try {
      const response = await fetch('/api/interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) return;

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch (err) {
      console.error('TTS error:', err);
    }
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleMicToggle = useCallback((enabled: boolean) => {
    setMicEnabled(enabled);
    if (mediaRecorderRef.current) {
      if (enabled) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
  }, []);

  const handleCameraToggle = useCallback((enabled: boolean) => {
    setCameraEnabled(enabled);
  }, []);

  const handleEndCall = useCallback(async () => {
    if (session) {
      await completeSession();
    }
  }, [session, completeSession]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (phase === 'lobby') {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-white">Interview Practice</h1>
          <p className="text-gray-400 text-lg">
            {targetRole} {seniority ? `(${seniority})` : ''} {company ? `at ${company}` : ''}
          </p>
          <button
            onClick={createSession}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start Interview
          </button>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>
      </div>
    );
  }

  if (phase === 'connecting') {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white">Connecting to interview...</p>
        </div>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-3xl font-bold text-white">Interview Complete!</h1>
          <p className="text-gray-400">Your interview has been recorded and analyzed.</p>
          {/* TODO: Show summary and report */}
          <button
            onClick={() => window.location.href = '/interview'}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoCallSimulator
      recruiterName="Recruiter"
      recruiterRole="Interviewer"
      recruiterPersona={recruiterPersona}
      interviewStage={session?.stage || 'INTRO'}
      isRecruiterSpeaking={isRecruiterSpeaking}
      recruiterMessage={recruiterMessage}
      candidateTranscript={candidateTranscript}
      isCandidateSpeaking={isCandidateSpeaking}
      isProcessing={isProcessing}
      turnCount={session?.turnCount || 0}
      maxTurns={maxTurns}
      onMicToggle={handleMicToggle}
      onCameraToggle={handleCameraToggle}
      onEndCall={handleEndCall}
      micEnabled={micEnabled}
      cameraEnabled={cameraEnabled}
      elapsedSeconds={elapsedSeconds}
    />
  );
}
