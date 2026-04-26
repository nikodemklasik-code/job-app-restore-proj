/**
 * VideoCallSimulator.tsx
 *
 * Realistic video call simulation for live interviews.
 * Mimics professional video conferencing (Zoom, Teams, Google Meet) with:
 * - Full-screen video layout
 * - Recruiter video feed (animated avatar with realistic expressions)
 * - Candidate camera preview (user's webcam)
 * - Real-time transcription overlay
 * - Call controls (mute, camera, end call)
 * - Interview progress indicator
 * - Adaptive UI based on interview stage
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageCircle, Clock, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import type { InterviewStage } from '../../../../../shared/interview';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecruiterPersona = 'hr' | 'hiring-manager' | 'tech-lead';

export interface VideoCallSimulatorProps {
  recruiterName: string;
  recruiterRole: string;
  recruiterPersona: RecruiterPersona;
  interviewStage: InterviewStage;
  isRecruiterSpeaking: boolean;
  recruiterMessage: string;
  candidateTranscript: string;
  isCandidateSpeaking: boolean;
  isProcessing: boolean;
  turnCount: number;
  maxTurns: number;
  onMicToggle: (enabled: boolean) => void;
  onCameraToggle: (enabled: boolean) => void;
  onEndCall: () => void;
  onSendMessage?: (message: string) => void;
  micEnabled: boolean;
  cameraEnabled: boolean;
  elapsedSeconds: number;
}

// ─── Persona Config ───────────────────────────────────────────────────────────

const PERSONA_CONFIG: Record<RecruiterPersona, { name: string; role: string; avatar: string; color: string; bgGradient: string }> = {
  'hr': {
    name: 'Sarah',
    role: 'HR Business Partner',
    avatar: '👩‍💼',
    color: '#6366f1',
    bgGradient: 'from-indigo-500 to-indigo-600',
  },
  'hiring-manager': {
    name: 'James',
    role: 'Engineering Manager',
    avatar: '👔',
    color: '#3b82f6',
    bgGradient: 'from-blue-500 to-blue-600',
  },
  'tech-lead': {
    name: 'Alex',
    role: 'Senior Tech Lead',
    avatar: '💻',
    color: '#0ea5e9',
    bgGradient: 'from-cyan-500 to-cyan-600',
  },
};

// ─── Stage Labels ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<InterviewStage, { label: string; description: string }> = {
  'INTRO': { label: 'Introduction', description: 'Getting to know each other' },
  'WARMUP': { label: 'Warm-up', description: 'Building rapport' },
  'CORE_EXPERIENCE': { label: 'Core Experience', description: 'Discussing your background' },
  'DEEP_DIVE': { label: 'Deep Dive', description: 'Exploring key skills' },
  'CANDIDATE_QUESTIONS': { label: 'Your Questions', description: 'Ask us anything' },
  'CLOSING': { label: 'Closing', description: 'Final thoughts' },
};

// ─── Animated Avatar Component ────────────────────────────────────────────────

function RecruiterAvatar({
  persona,
  isSpeaking,
  isListening,
}: {
  persona: RecruiterPersona;
  isSpeaking: boolean;
  isListening: boolean;
}) {
  const config = PERSONA_CONFIG[persona];
  const [blinkPhase, setBlinkPhase] = useState(false);

  useEffect(() => {
    if (!isSpeaking && !isListening) {
      const timer = setInterval(() => setBlinkPhase((p) => !p), 3000 + Math.random() * 2000);
      return () => clearInterval(timer);
    }
  }, [isSpeaking, isListening]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${config.bgGradient}`} />

      {/* Avatar circle */}
      <div className="relative z-10">
        {/* Outer ring - pulsing when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse" style={{ width: '140px', height: '140px', top: '-10px', left: '-10px' }} />
        )}

        {/* Listening indicator */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" style={{ width: '140px', height: '140px', top: '-10px', left: '-10px' }} />
        )}

        {/* Main avatar */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg transition-transform ${isSpeaking ? 'scale-110' : 'scale-100'}`} style={{ backgroundColor: config.color }}>
          {config.avatar}
        </div>

        {/* Eyes indicator */}
        <div className="absolute top-6 left-4 w-2 h-2 bg-white rounded-full" style={{ opacity: blinkPhase ? 0.3 : 1, transition: 'opacity 0.1s' }} />
        <div className="absolute top-6 right-4 w-2 h-2 bg-white rounded-full" style={{ opacity: blinkPhase ? 0.3 : 1, transition: 'opacity 0.1s' }} />

        {/* Microphone indicator */}
        {isSpeaking && (
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-xs">
            🎤
          </div>
        )}
      </div>

      {/* Name and role below avatar */}
      <div className="absolute bottom-8 text-center">
        <div className="text-white font-semibold text-lg">{config.name}</div>
        <div className="text-gray-300 text-sm">{config.role}</div>
      </div>
    </div>
  );
}

// ─── Candidate Camera Preview ─────────────────────────────────────────────────

function CandidateCameraPreview({
  cameraEnabled,
  isSpeaking,
}: {
  cameraEnabled: boolean;
  isSpeaking: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!cameraEnabled || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [cameraEnabled]);

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border-2 transition-colors ${isSpeaking ? 'border-green-400' : 'border-gray-600'}`}>
      {cameraEnabled ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isSpeaking && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Speaking
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <VideoOff className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <div className="text-gray-400 text-sm">Camera is off</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transcription Overlay ────────────────────────────────────────────────────

function TranscriptionOverlay({
  recruiterMessage,
  candidateTranscript,
  isRecruiterSpeaking,
  isCandidateSpeaking,
}: {
  recruiterMessage: string;
  candidateTranscript: string;
  isRecruiterSpeaking: boolean;
  isCandidateSpeaking: boolean;
}) {
  return (
    <div className="space-y-2">
      {/* Recruiter message */}
      {isRecruiterSpeaking && recruiterMessage && (
        <div className="bg-blue-900 bg-opacity-80 text-white p-3 rounded-lg text-sm border-l-4 border-blue-400 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-semibold text-xs text-blue-300 mb-1">Recruiter</div>
          <div className="line-clamp-3">{recruiterMessage}</div>
        </div>
      )}

      {/* Candidate transcript */}
      {isCandidateSpeaking && candidateTranscript && (
        <div className="bg-green-900 bg-opacity-80 text-white p-3 rounded-lg text-sm border-l-4 border-green-400 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-semibold text-xs text-green-300 mb-1">You</div>
          <div className="line-clamp-3">{candidateTranscript}</div>
        </div>
      )}
    </div>
  );
}

// ─── Call Controls ────────────────────────────────────────────────────────────

function CallControls({
  micEnabled,
  cameraEnabled,
  onMicToggle,
  onCameraToggle,
  onEndCall,
}: {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onMicToggle: (enabled: boolean) => void;
  onCameraToggle: (enabled: boolean) => void;
  onEndCall: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 bg-gray-900 bg-opacity-90 px-6 py-4 rounded-full backdrop-blur-sm border border-gray-700">
      {/* Microphone */}
      <button
        onClick={() => onMicToggle(!micEnabled)}
        className={`p-3 rounded-full transition-all ${
          micEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={micEnabled ? 'Mute' : 'Unmute'}
      >
        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera */}
      <button
        onClick={() => onCameraToggle(!cameraEnabled)}
        className={`p-3 rounded-full transition-all ${
          cameraEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* End call */}
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
        title="End call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Interview Progress ───────────────────────────────────────────────────────

function InterviewProgress({
  turnCount,
  maxTurns,
  stage,
  elapsedSeconds,
}: {
  turnCount: number;
  maxTurns: number;
  stage: InterviewStage;
  elapsedSeconds: number;
}) {
  const progress = (turnCount / maxTurns) * 100;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const stageInfo = STAGE_LABELS[stage];

  return (
    <div className="space-y-2">
      {/* Stage indicator */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-white text-sm">{stageInfo.label}</div>
          <div className="text-gray-400 text-xs">{stageInfo.description}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-300 text-sm font-mono">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
          <div className="text-gray-500 text-xs">{turnCount} / {maxTurns} questions</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VideoCallSimulator({
  recruiterName,
  recruiterRole,
  recruiterPersona,
  interviewStage,
  isRecruiterSpeaking,
  recruiterMessage,
  candidateTranscript,
  isCandidateSpeaking,
  isProcessing,
  turnCount,
  maxTurns,
  onMicToggle,
  onCameraToggle,
  onEndCall,
  micEnabled,
  cameraEnabled,
  elapsedSeconds,
}: VideoCallSimulatorProps) {
  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col">
      {/* Main video area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Recruiter video (main) */}
        <div className="flex-1 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
          <RecruiterAvatar persona={recruiterPersona} isSpeaking={isRecruiterSpeaking} isListening={!isRecruiterSpeaking && !isProcessing} />
        </div>

        {/* Candidate camera (PiP) */}
        <div className="w-64 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <CandidateCameraPreview cameraEnabled={cameraEnabled} isSpeaking={isCandidateSpeaking} />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 space-y-4">
        {/* Transcription */}
        <TranscriptionOverlay
          recruiterMessage={recruiterMessage}
          candidateTranscript={candidateTranscript}
          isRecruiterSpeaking={isRecruiterSpeaking}
          isCandidateSpeaking={isCandidateSpeaking}
        />

        {/* Progress and info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <InterviewProgress turnCount={turnCount} maxTurns={maxTurns} stage={interviewStage} elapsedSeconds={elapsedSeconds} />
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-end gap-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                Processing...
              </div>
            )}
            {isRecruiterSpeaking && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Volume2 className="w-4 h-4" />
                Recruiter speaking
              </div>
            )}
            {isCandidateSpeaking && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Mic className="w-4 h-4" />
                You're speaking
              </div>
            )}
          </div>
        </div>

        {/* Call controls */}
        <div className="flex justify-center">
          <CallControls
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            onMicToggle={onMicToggle}
            onCameraToggle={onCameraToggle}
            onEndCall={onEndCall}
          />
        </div>
      </div>
    </div>
  );
}
