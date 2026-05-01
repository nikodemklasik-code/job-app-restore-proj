import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function InterviewPracticeFamilyPage() {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic>(INTERVIEW_TOPICS[0]);
  const [messages, setMessages] = useState<PracticeMessage[]>([
    {
      id: practiceId('assistant'),
      role: 'assistant',
      content: 'Pick a topic below, then answer like you are in a real interview. I will ask, listen, and probe. Camera mode comes later, so for now humanity may survive with voice and typing.',
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
        description="Front-facing interviewer flow: realistic prompts, follow-up pressure, transcript continuity, and voice/text input."
        statusLabel="Conversation mode"
        cameraLabel="Camera available"
        accentClass="bg-gradient-to-br from-indigo-500 to-violet-600"
        onReset={reset}
      />

      <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
          <span className="text-base">🎥</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Live Video Interview</p>
          <p className="text-xs text-slate-400">Full video call experience with camera preview, AI avatar, and real-time feedback</p>
        </div>
        <button
          onClick={() => void navigate('/interview/live')}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Launch →
        </button>
      </div>

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

        <PracticeSidePanel title="Interview Dynamics">
          <SidePanelCard label="Main window">The large front window is the interviewer conversation, not a pile of setup cards.</SidePanelCard>
          <SidePanelCard label="Topic rail">Topics sit below the conversation so the session stays focused.</SidePanelCard>
          <SidePanelCard label="Future camera">The shell leaves room for camera without pretending it works today.</SidePanelCard>
        </PracticeSidePanel>
      </main>
    </div>
  );
}
