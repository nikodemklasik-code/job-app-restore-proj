import { useState } from 'react';
import { api } from '@/lib/api';
import {
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

const COACH_TOPICS: PracticeTopic[] = [
  {
    id: 'pressure-story',
    label: 'Pressure Story',
    description: 'Practise a story about solving a hard problem under pressure.',
    prompt: 'Tell me about a time you solved a difficult problem under pressure.',
    meta: 'STAR',
  },
  {
    id: 'feedback-growth',
    label: 'Feedback & Growth',
    description: 'Work on self-awareness, learning, and improvement framing.',
    prompt: 'Tell me about a time you received critical feedback and how you responded.',
    meta: 'growth',
  },
  {
    id: 'technical-ownership',
    label: 'Technical Ownership',
    description: 'Improve how you explain craft, decisions, and quality standards.',
    prompt: 'How do you approach writing code that others will maintain?',
    meta: 'craft',
  },
  {
    id: 'motivation',
    label: 'Motivation',
    description: 'Clarify next-role goals and make answers less foggy.',
    prompt: 'What does success look like to you in your next role?',
    meta: 'fit',
  },
];

type Feedback = {
  score?: number;
  label?: string;
  whatWorked?: string[];
  toImprove?: string[];
  expertInsight?: string;
  interviewTip?: string;
};

function fallbackFeedback(answer: string): Feedback {
  return {
    score: Math.min(92, Math.max(48, Math.round(answer.length / 10))),
    label: 'Local coaching pass',
    whatWorked: ['You gave enough material to start coaching the answer.'],
    toImprove: ['Make the structure explicit: context, action, result, lesson.'],
    expertInsight: 'A strong coach screen should turn one answer into the next practice decision, not just applaud like a broken vending machine.',
    interviewTip: 'Rewrite the answer in 90 seconds with one measurable result.',
  };
}

function feedbackToMessage(feedback: Feedback): string {
  const worked = feedback.whatWorked?.map((item) => `• ${item}`).join('\n') ?? '• Add more specific examples.';
  const improve = feedback.toImprove?.map((item) => `• ${item}`).join('\n') ?? '• Add a measurable result.';
  return `Score: ${feedback.score ?? 'n/a'}${feedback.label ? ` · ${feedback.label}` : ''}\n\nWhat worked:\n${worked}\n\nTo improve:\n${improve}\n\nCoach note:\n${feedback.expertInsight ?? feedback.interviewTip ?? 'Practise the same answer once more with tighter structure.'}`;
}

export default function CoachFamilyPage() {
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic>(COACH_TOPICS[0]);
  const [messages, setMessages] = useState<PracticeMessage[]>([
    {
      id: practiceId('assistant'),
      role: 'assistant',
      content: 'Pick a coaching topic below. Coach is not an interviewer clone: you answer, then get structured feedback and a next drill.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = usePracticeVoiceInput((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)));
  const evaluateMutation = api.coach.evaluateAnswer.useMutation();

  const reset = () => {
    setMessages([{ id: practiceId('assistant'), role: 'assistant', content: 'New coaching session ready. Choose a topic and answer it.' }]);
    setInput('');
    setError(null);
  };

  const evaluate = async (overrideText?: string, topic = selectedTopic) => {
    const answer = (overrideText ?? input).trim();
    if (!answer || isEvaluating) return;
    setInput('');
    setError(null);
    const userMessage: PracticeMessage = { id: practiceId('user'), role: 'user', content: answer };
    setMessages((current) => [...current, userMessage]);
    setIsEvaluating(true);

    try {
      const result = await evaluateMutation.mutateAsync({
        category: topic.id.includes('technical') ? 'technical' : topic.id.includes('motivation') ? 'motivation' : 'behavioural',
        question: topic.prompt,
        answer,
      });
      setMessages((current) => [...current, { id: practiceId('assistant'), role: 'assistant', content: feedbackToMessage(result as Feedback) }]);
    } catch {
      setMessages((current) => [...current, { id: practiceId('assistant'), role: 'assistant', content: feedbackToMessage(fallbackFeedback(answer)) }]);
      setError('Server coaching failed, so a local coaching fallback was shown. Not ideal, but better than a dead button pretending to meditate.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const selectTopic = (topic: PracticeTopic) => {
    setSelectedTopic(topic);
    setMessages((current) => [
      ...current,
      { id: practiceId('assistant'), role: 'assistant', content: `Coach topic selected: ${topic.label}\n\n${topic.prompt}\n\nAnswer in text or voice, then I will evaluate structure, clarity, and next practice.` },
    ]);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] min-h-[760px] max-w-7xl flex-col gap-4 overflow-hidden px-1">
      <PracticeExperienceHeader
        eyebrow="Strategic guidance"
        title="Coach"
        description="Front-facing coaching workspace: choose a prompt, answer, receive structured feedback, then practise again. Similar family, different rhythm. Apparently nuance survived."
        statusLabel="Feedback mode"
        cameraLabel="Camera later"
        accentClass="bg-gradient-to-br from-emerald-500 to-teal-600"
        onReset={reset}
      />

      <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
            <PracticeConversationWindow
              messages={messages}
              isBusy={isEvaluating}
              emptyState={<div className="p-8 text-center text-sm text-slate-400">Pick a coaching prompt below.</div>}
            />
            {error || voice.voiceError ? <p className="mx-4 mb-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{error ?? voice.voiceError}</p> : null}
            <PracticeInputBar
              value={input}
              placeholder="Write or dictate your answer for coaching feedback…"
              disabled={isEvaluating}
              isRecording={voice.isRecording}
              isTranscribing={voice.isTranscribing}
              onChange={setInput}
              onSend={() => void evaluate()}
              onToggleRecording={() => void voice.toggleRecording()}
            />
          </div>
          <PracticeTopicRail topics={COACH_TOPICS} selectedTopicId={selectedTopic.id} onSelect={selectTopic} />
        </section>

        <PracticeSidePanel title="Coach Dynamics">
          <SidePanelCard label="Main window">A coaching log: prompt, answer, feedback, next drill.</SidePanelCard>
          <SidePanelCard label="Different from Interview">Coach evaluates and reframes; it does not pretend to be the recruiter.</SidePanelCard>
          <SidePanelCard label="Future camera">Later camera support can attach to answer delivery and presence coaching.</SidePanelCard>
        </PracticeSidePanel>
      </main>
    </div>
  );
}
