import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { fetchStream } from '@/lib/apiClient';
import {
  consumeSseStream,
  PracticeConversationWindow,
  PracticeExperienceHeader,
  PracticeInputBar,
  PracticeSidePanel,
  PracticeTopicRail,
  SidePanelCard,
  practiceId,
  usePracticeVoiceInput,
  type PracticeMessage,
  type PracticeTopic,
} from '@/features/practice-family/PracticeExperienceChrome';

const INTERVIEW_TOPICS: PracticeTopic[] = [
  {
    id: 'behavioural-star',
    label: 'Behavioural STAR',
    description: 'Classic experience question with structure and follow-up pressure.',
    prompt: 'Start a behavioural interview. Ask one STAR question and challenge my answer with one follow-up.',
    meta: 'core',
  },
  {
    id: 'technical-depth',
    label: 'Technical Depth',
    description: 'System, craft, trade-off, debugging, and technical ownership questions.',
    prompt: 'Start a technical interview. Ask one question about debugging a production issue and probe my reasoning.',
    meta: 'tech',
  },
  {
    id: 'motivation-fit',
    label: 'Motivation Fit',
    description: 'Role fit, motivation, environment, manager, and career direction.',
    prompt: 'Start a motivation and role-fit interview. Ask one realistic screening question.',
    meta: 'fit',
  },
  {
    id: 'pressure-round',
    label: 'Pressure Round',
    description: 'Short sharper prompts with interviewer pushback.',
    prompt: 'Run a pressure round. Ask a concise question and push back if my answer is vague.',
    meta: 'hard',
  },
];

function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch {
      setError('Camera access denied. Check browser permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover scale-x-[-1]"
        />
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <VideoOff className="h-5 w-5 text-slate-500" />
            </div>
            <span className="text-xs text-slate-500">Camera off</span>
          </div>
        )}
        {cameraOn && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
            <span className="text-xs font-medium text-white">You</span>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

      <button
        onClick={() => void (cameraOn ? stopCamera() : startCamera())}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
          cameraOn
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
            : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
        }`}
      >
        {cameraOn ? <><VideoOff className="h-4 w-4" /> Turn off camera</> : <><Video className="h-4 w-4" /> Turn on camera</>}
      </button>
    </div>
  );
}

export default function InterviewPracticeFamilyPage() {
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic>(INTERVIEW_TOPICS[0]);
  const [messages, setMessages] = useState<PracticeMessage[]>([
    {
      id: practiceId('assistant'),
      role: 'assistant',
      content: 'Pick a topic below, then answer like you are in a real interview. I will ask, listen, and probe.',
    },
  ]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = usePracticeVoiceInput((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)));

  const reset = () => {
    setMessages([
      {
        id: practiceId('assistant'),
        role: 'assistant',
        content: 'New interview session ready. Choose a topic and begin.',
      },
    ]);
    setInput('');
    setStreamingText('');
    setError(null);
  };

  const send = async (overrideText?: string, topic = selectedTopic) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;
    setInput('');
    setError(null);
    const nextMessages = [...messages, { id: practiceId('user'), role: 'user' as const, content: text }];
    setMessages(nextMessages);
    setIsStreaming(true);
    setStreamingText('');

    try {
      const response = await fetchStream('/api/interview/stream', {
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        job: { title: topic.label, company: 'Practice session', description: topic.description },
        mode: 'behavioral',
      });
      const fullText = await consumeSseStream(response, setStreamingText);
      setMessages((current) => [...current, { id: practiceId('assistant'), role: 'assistant', content: fullText || 'I could not generate the next interview turn.' }]);
      setStreamingText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Interview stream failed.');
    } finally {
      setIsStreaming(false);
    }
  };

  const selectTopic = (topic: PracticeTopic) => {
    setSelectedTopic(topic);
    void send(topic.prompt, topic);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] min-h-[760px] max-w-7xl flex-col gap-4 overflow-hidden px-1">
      <PracticeExperienceHeader
        eyebrow="Mock interview"
        title="Interview"
        description="Front-facing interviewer flow: realistic prompts, follow-up pressure, transcript continuity, voice/text input, and camera preview."
        statusLabel="Conversation mode"
        accentClass="bg-gradient-to-br from-indigo-500 to-violet-600"
        onReset={reset}
      />

      <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
            <PracticeConversationWindow
              messages={messages}
              streamingText={streamingText}
              isBusy={isStreaming}
              emptyState={<div className="p-8 text-center text-sm text-slate-400">Pick an interview topic below.</div>}
            />
            {error || voice.voiceError ? <p className="mx-4 mb-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error ?? voice.voiceError}</p> : null}
            <PracticeInputBar
              value={input}
              placeholder="Answer the interviewer…"
              disabled={isStreaming}
              isRecording={voice.isRecording}
              isTranscribing={voice.isTranscribing}
              onChange={setInput}
              onSend={() => void send()}
              onToggleRecording={() => void voice.toggleRecording()}
            />
          </div>
          <PracticeTopicRail topics={INTERVIEW_TOPICS} selectedTopicId={selectedTopic.id} onSelect={selectTopic} />
        </section>

        <PracticeSidePanel title="Camera & Tips">
          <CameraPreview />
          <SidePanelCard label="Topic rail">Topics sit below the conversation so the session stays focused.</SidePanelCard>
          <SidePanelCard label="Voice input">Use the mic button to speak your answers — transcribed automatically.</SidePanelCard>
        </PracticeSidePanel>
      </main>
    </div>
  );
}
