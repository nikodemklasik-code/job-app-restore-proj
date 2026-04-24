import { useState } from 'react';
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

const NEGOTIATION_TOPICS: PracticeTopic[] = [
  {
    id: 'salary-counter',
    label: 'Salary Counter',
    description: 'Shape a counter-offer without sounding apologetic or chaotic.',
    prompt: 'Help me prepare a salary counter-offer. Ask for my current offer, target, floor, and leverage.',
    meta: 'salary',
  },
  {
    id: 'contract-rate',
    label: 'Contract Rate',
    description: 'Day-rate, scope, term, and leverage framing.',
    prompt: 'Help me negotiate a contract day rate. Start by asking for offer, target, alternatives, and constraints.',
    meta: 'rate',
  },
  {
    id: 'benefits-tradeoff',
    label: 'Benefits Trade-off',
    description: 'Remote, bonus, equity, holiday, title, and start-date trade-offs.',
    prompt: 'Help me negotiate benefits and trade-offs when base salary is constrained.',
    meta: 'terms',
  },
  {
    id: 'simulated-hr',
    label: 'Simulated HR',
    description: 'Back-and-forth roleplay with pushback and counter language.',
    prompt: 'Start a negotiation simulation. You play HR and push back on my first counter-offer.',
    meta: 'sim',
  },
];

export default function NegotiationFamilyPage() {
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic>(NEGOTIATION_TOPICS[0]);
  const [messages, setMessages] = useState<PracticeMessage[]>([
    {
      id: practiceId('assistant'),
      role: 'assistant',
      content: 'Pick a negotiation topic below. This screen is about positioning, leverage, trade-offs, and simulation. It is related to Coach and Interview, not their identical twin in a cheaper jacket.',
    },
  ]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = usePracticeVoiceInput((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)));

  const reset = () => {
    setMessages([{ id: practiceId('assistant'), role: 'assistant', content: 'New negotiation session ready. Choose a topic and set your position.' }]);
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
      const path = topic.id === 'simulated-hr' ? '/api/negotiation/simulate' : '/api/negotiation/stream';
      const payload = topic.id === 'simulated-hr'
        ? {
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
            offer: {
              role: 'Target role',
              company: 'Target company',
              offeredSalary: 55000,
              currency: 'GBP',
              targetSalary: 65000,
              marketRate: 62000,
              benefits: 'standard benefits',
            },
          }
        : { messages: nextMessages.map(({ role, content }) => ({ role, content })) };
      const response = await fetchStream(path, payload);
      const fullText = await consumeSseStream(response, setStreamingText);
      setMessages((current) => [...current, { id: practiceId('assistant'), role: 'assistant', content: fullText || 'I could not generate negotiation guidance.' }]);
      setStreamingText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Negotiation stream failed.');
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
        eyebrow="Offer strategy"
        title="Negotiations"
        description="Front-facing negotiation workspace: strategy first, simulation when needed, voice or text input now, camera-compatible structure later. Similar shell, sharper dynamic."
        statusLabel="Strategy mode"
        cameraLabel="Camera later"
        accentClass="bg-gradient-to-br from-amber-500 to-orange-600"
        onReset={reset}
      />

      <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
            <PracticeConversationWindow
              messages={messages}
              streamingText={streamingText}
              isBusy={isStreaming}
              emptyState={<div className="p-8 text-center text-sm text-slate-400">Pick a negotiation topic below.</div>}
            />
            {error || voice.voiceError ? <p className="mx-4 mb-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error ?? voice.voiceError}</p> : null}
            <PracticeInputBar
              value={input}
              placeholder="Write or dictate your position, offer, target, and constraints…"
              disabled={isStreaming}
              isRecording={voice.isRecording}
              isTranscribing={voice.isTranscribing}
              onChange={setInput}
              onSend={() => void send()}
              onToggleRecording={() => void voice.toggleRecording()}
            />
          </div>
          <PracticeTopicRail topics={NEGOTIATION_TOPICS} selectedTopicId={selectedTopic.id} onSelect={selectTopic} />
        </section>

        <PracticeSidePanel title="Negotiation Dynamics">
          <SidePanelCard label="Main window">Strategy and simulation conversation with offer context and trade-offs.</SidePanelCard>
          <SidePanelCard label="Different from Coach">Negotiation focuses on leverage, anchors, floor, counter, and relationship preservation.</SidePanelCard>
          <SidePanelCard label="Future camera">Camera can later support live roleplay delivery and confidence review.</SidePanelCard>
        </PracticeSidePanel>
      </main>
    </div>
  );
}
