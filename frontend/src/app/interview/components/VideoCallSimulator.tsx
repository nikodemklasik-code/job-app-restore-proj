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

import { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterviewStage = 'INTRO' | 'WARMUP' | 'CORE_EXPERIENCE' | 'DEEP_DIVE' | 'CANDIDATE_QUESTIONS' | 'CLOSING';
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
  const [speakingAnimation, setSpeakingAnimation] = useState(0);

  // Blinking animation
  useEffect(() => {
    if (!isSpeaking && !isListening) {
      const timer = setInterval(() => setBlinkPhase((p) => !p), 3000 + Math.random() * 2000);
      return () => clearInterval(timer);
    }
  }, [isSpeaking, isListening]);

  // Speaking animation - mouth movement
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingAnimation(0);
      return;
    }
    const timer = setInterval(() => {
      setSpeakingAnimation((prev) => (prev + 1) % 3);
    }, 200);
    return () => clearInterval(timer);
  }, [isSpeaking]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br ${config.bgGradient} blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-gradient-to-br ${config.bgGradient} blur-3xl animate-pulse`} style={{ animationDelay: '1s' }} />
      </div>

      {/* Avatar container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer glow rings */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-green-400/40 animate-ping" style={{ width: '200px', height: '200px', top: '-38px', left: '-38px' }} />
            <div className="absolute inset-0 rounded-full border-3 border-green-400/60 animate-pulse" style={{ width: '170px', height: '170px', top: '-23px', left: '-23px' }} />
          </>
        )}

        {isListening && !isSpeaking && (
          <div className="absolute inset-0 rounded-full border-3 border-blue-400/50 animate-pulse" style={{ width: '170px', height: '170px', top: '-23px', left: '-23px' }} />
        )}

        {/* Main avatar circle with enhanced styling */}
        <div
          className={`relative w-32 h-32 rounded-full flex items-center justify-center text-7xl shadow-2xl transition-all duration-300 ${isSpeaking ? 'scale-110 shadow-green-500/50' : 'scale-100'
            }`}
          style={{
            backgroundColor: config.color,
            boxShadow: isSpeaking ? `0 0 40px ${config.color}80, 0 0 80px ${config.color}40` : `0 10px 40px rgba(0,0,0,0.5)`
          }}
        >
          {/* Avatar emoji */}
          <div className={`transition-transform duration-200 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
            {config.avatar}
          </div>

          {/* Speaking indicator - animated mouth */}
          {isSpeaking && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className={`w-8 h-2 bg-white/80 rounded-full transition-all duration-100 ${speakingAnimation === 0 ? 'scale-x-100' : speakingAnimation === 1 ? 'scale-x-125 scale-y-150' : 'scale-x-75'
                }`} />
            </div>
          )}

          {/* Microphone indicator badge */}
          {isSpeaking && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-900 animate-pulse">
              <Mic className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Muted indicator when not speaking */}
          {!isSpeaking && !isListening && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-900">
              <MicOff className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Name tag - Zoom-style */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700 shadow-xl min-w-[200px]">
          <div className="text-white font-semibold text-base text-center">{config.name}</div>
          <div className="text-gray-400 text-xs text-center mt-0.5">{config.role}</div>
          {isSpeaking && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            </div>
          )}
        </div>
      </div>

      {/* Connection quality indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700">
        <div className="flex gap-0.5">
          <div className="w-1 h-3 bg-green-400 rounded-full" />
          <div className="w-1 h-4 bg-green-400 rounded-full" />
          <div className="w-1 h-5 bg-green-400 rounded-full" />
        </div>
        <span className="text-xs text-gray-300">HD</span>
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
    <div className={`relative w-full h-full bg-gray-900 rounded-xl overflow-hidden border-3 transition-all duration-300 ${isSpeaking ? 'border-green-400 shadow-lg shadow-green-500/50' : 'border-gray-700'
      }`}>
      {cameraEnabled ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

          {/* Speaking indicator overlay */}
          {isSpeaking && (
            <>
              <div className="absolute inset-0 border-4 border-green-400 rounded-xl animate-pulse pointer-events-none" />
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
                Speaking
              </div>
            </>
          )}

          {/* Name tag - Zoom style */}
          <div className="absolute bottom-3 left-3 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700">
            <div className="text-white text-sm font-semibold">You</div>
          </div>

          {/* Mic indicator */}
          <div className="absolute bottom-3 right-3">
            {isSpeaking ? (
              <div className="bg-green-500 p-2 rounded-full shadow-lg">
                <Mic className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="bg-gray-700 p-2 rounded-full">
                <MicOff className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <VideoOff className="w-10 h-10 text-gray-500" />
            </div>
            <div className="text-gray-400 text-sm font-medium">Camera is off</div>
            <div className="text-gray-600 text-xs mt-1">Click camera button to turn on</div>
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
        className={`p-3 rounded-full transition-all ${micEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        title={micEnabled ? 'Mute' : 'Unmute'}
      >
        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera */}
      <button
        onClick={() => onCameraToggle(!cameraEnabled)}
        className={`p-3 rounded-full transition-all ${cameraEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
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
  recruiterPersona,
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
      {/* Top bar - Zoom style */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300 font-medium">Live Interview</span>
          </div>
          <div className="text-sm text-gray-500">
            {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection quality */}
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
            <div className="flex gap-0.5">
              <div className="w-1 h-2 bg-green-400 rounded-full" />
              <div className="w-1 h-3 bg-green-400 rounded-full" />
              <div className="w-1 h-4 bg-green-400 rounded-full" />
            </div>
            <span className="text-xs text-gray-400">Stable</span>
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Recruiter video (main) */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-800 bg-gray-900">
          <RecruiterAvatar persona={recruiterPersona} isSpeaking={isRecruiterSpeaking} isListening={!isRecruiterSpeaking && !isProcessing} />
        </div>

        {/* Candidate camera (PiP) - Zoom style positioning */}
        <div className="w-72 h-48 rounded-xl overflow-hidden shadow-2xl">
          <CandidateCameraPreview cameraEnabled={cameraEnabled} isSpeaking={isCandidateSpeaking} />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-4">
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
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-700/30">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                Processing...
              </div>
            )}
            {isRecruiterSpeaking && (
              <div className="flex items-center gap-2 text-blue-400 text-sm bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-700/30">
                <Volume2 className="w-4 h-4" />
                Recruiter speaking
              </div>
            )}
            {isCandidateSpeaking && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-700/30">
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
