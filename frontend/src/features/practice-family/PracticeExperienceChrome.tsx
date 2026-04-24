import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Camera, Loader2, Mic, MicOff, RefreshCw, Send, Sparkles } from 'lucide-react';
import { postForm } from '@/lib/apiClient';

export type PracticeMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

export type PracticeTopic = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  meta?: string;
};

export function practiceId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function consumeSseStream(response: Response, onPartial: (fullText: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter((line) => line.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data) as { chunk?: string; content?: string; text?: string };
        const chunk = parsed.chunk ?? parsed.content ?? parsed.text;
        if (chunk) {
          fullText += chunk;
          onPartial(fullText);
        }
      } catch {
        // Ignore malformed event chunks. The stream remains best-effort.
      }
    }
  }

  return fullText;
}

export function usePracticeVoiceInput(onTranscript: (text: string) => void) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      setVoiceError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', new Blob(chunksRef.current, { type: 'audio/webm' }), 'audio.webm');
          const result = await postForm<{ transcript?: string }>('/api/interview/transcribe', form);
          const transcript = result.transcript?.trim();
          if (transcript) onTranscript(transcript);
        } catch {
          setVoiceError('Voice transcription failed. Type your answer instead.');
        } finally {
          setIsTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setVoiceError('Microphone is not available. Type your answer instead.');
      setIsRecording(false);
    }
  };

  return { isRecording, isTranscribing, voiceError, toggleRecording };
}

export function PracticeExperienceHeader({
  eyebrow,
  title,
  description,
  statusLabel,
  cameraLabel,
  accentClass,
  onReset,
}: {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  cameraLabel: string;
  accentClass: string;
  onReset: () => void;
}) {
  return (
    <header className="shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            {statusLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-500">
            <Camera className="h-4 w-4" />
            {cameraLabel}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            New session
          </button>
        </div>
      </div>
    </header>
  );
}

export function PracticeConversationWindow({
  messages,
  streamingText,
  isBusy,
  emptyState,
}: {
  messages: PracticeMessage[];
  streamingText?: string;
  isBusy?: boolean;
  emptyState: ReactNode;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText, isBusy]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
      {messages.length === 0 ? emptyState : null}
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${isUser ? 'bg-indigo-600' : 'bg-white/10'}`}>
              {isUser ? 'You' : 'AI'}
            </div>
            <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm border border-white/10 bg-white/[0.055] text-slate-200'}`}>
              {message.content}
            </div>
          </div>
        );
      })}
      {streamingText ? (
        <div className="flex gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10">AI</div>
          <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-6 text-slate-200">
            {streamingText}
          </div>
        </div>
      ) : null}
      {isBusy && !streamingText ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-300" /> Processing…
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

export function PracticeTopicRail({ topics, selectedTopicId, onSelect }: { topics: PracticeTopic[]; selectedTopicId?: string; onSelect: (topic: PracticeTopic) => void }) {
  return (
    <section className="shrink-0 rounded-3xl border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Topic rail</p>
          <p className="text-sm font-semibold text-white">Horizontal, readable, and deliberately below the main window.</p>
        </div>
        <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 sm:inline-flex">{topics.length} options</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {topics.map((topic) => {
          const active = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelect(topic)}
              className={`min-w-[230px] rounded-2xl border p-3 text-left transition ${
                active ? 'border-indigo-400/50 bg-indigo-500/15' : 'border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{topic.label}</p>
                {topic.meta ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">{topic.meta}</span> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{topic.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PracticeInputBar({
  value,
  placeholder,
  disabled,
  isRecording,
  isTranscribing,
  onChange,
  onSend,
  onToggleRecording,
}: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleRecording: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
    el.style.overflowY = el.scrollHeight > 132 ? 'auto' : 'hidden';
  }, [value]);

  return (
    <div className="shrink-0 border-t border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onToggleRecording}
          disabled={disabled}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
            isRecording ? 'border-rose-400/40 bg-rose-500/15 text-rose-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          disabled={disabled}
          placeholder={isTranscribing ? 'Transcribing…' : placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function PracticeSidePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="hidden min-h-0 space-y-4 overflow-y-auto lg:block">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div className="mt-3 space-y-3">{children}</div>
      </section>
    </aside>
  );
}

export function SidePanelCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}
