<<<<<<< HEAD
import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Bot, User, RefreshCw, X, Volume2, VolumeX, MessageSquarePlus, Mic, MicOff } from 'lucide-react';
=======
import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, RefreshCw, X } from 'lucide-react';
>>>>>>> live-hardening
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { useCareerAssistantStore } from '@/stores/careerAssistantStore';

<<<<<<< HEAD
const API_BASE = import.meta.env.VITE_API_URL ?? '';

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
    const data = await res.json() as { transcript?: string };
    return data.transcript ?? '';
  } catch {
    return '';
  }
}

async function speakText(text: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/interview/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 500) }),
      credentials: 'include',
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      void audio.play().catch(() => resolve());
    });
  } catch {
    // TTS is non-fatal
  }
}

=======
>>>>>>> live-hardening
const QUICK_ACTIONS: { prompt: string; mode: 'general' | 'cv' | 'interview' | 'salary' }[] = [
  { prompt: 'Review my CV for a Senior Frontend role', mode: 'cv' },
  { prompt: 'How should I negotiate salary?', mode: 'salary' },
  { prompt: 'Prepare me for a behavioural interview', mode: 'interview' },
  { prompt: 'What are the best job search strategies right now?', mode: 'general' },
];

const MAX_TEXTAREA_ROWS = 5;
const LINE_HEIGHT_PX = 24;

export default function AssistantPage() {
  const { isSignedIn } = useUser();

  const [input, setInput] = useState('');
<<<<<<< HEAD
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { messages, status, error, loadHistory, sendMessage, resetError, clearMessages } =
=======
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, status, error, loadHistory, sendMessage, resetError } =
>>>>>>> live-hardening
    useCareerAssistantStore();

  const isSending = status === 'sending';
  const isLoading = status === 'syncing';

  // Load history once when signed in
  useEffect(() => {
    if (isSignedIn) {
      void loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = MAX_TEXTAREA_ROWS * LINE_HEIGHT_PX + 20;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

<<<<<<< HEAD
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        const transcript = await transcribeAudio(blob);
        setIsTranscribing(false);
        if (transcript.trim()) {
          setInput((prev) => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
          textareaRef.current?.focus();
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      // mic denied or not available
    }
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

=======
>>>>>>> live-hardening
  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text, 'general');
  };

<<<<<<< HEAD
  const handleSpeak = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      setSpeakingMsgId(null);
      return;
    }
    setSpeakingMsgId(msgId);
    await speakText(text);
    setSpeakingMsgId(null);
  };

  const handleNewChat = () => {
    if (typeof clearMessages === 'function') {
      clearMessages();
    }
  };

=======
>>>>>>> live-hardening
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            AI Career Assistant
          </h1>
          <p className="mt-1 text-slate-500">
            Your personal career strategist powered by GPT-4o.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Private messages from Instagram, Facebook, and LinkedIn are not used as AI input.
          </p>
        </div>
<<<<<<< HEAD
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            title="Start new chat"
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Nowy czat</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadHistory()}
            disabled={isLoading}
            title="Refresh conversation"
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs">Odśwież</span>
          </Button>
        </div>
=======
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void loadHistory()}
          disabled={isLoading}
          title="Refresh conversation"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-xs">Refresh</span>
        </Button>
>>>>>>> live-hardening
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <span>{error}</span>
          <button
            type="button"
            onClick={resetError}
            className="ml-3 shrink-0 rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950">
              <Bot className="h-7 w-7 text-indigo-600" />
            </div>
            <p className="text-slate-500">
              Career, CV, interviews — follow-up messages keep conversation context.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.prompt}
                  type="button"
                  onClick={() => void sendMessage(action.prompt, action.mode)}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-left text-xs text-slate-600 transition-colors hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                >
                  {action.prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user'
                      ? 'bg-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-slate-500" />
                  )}
                </div>
<<<<<<< HEAD
                <div className={`flex max-w-[80%] flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {/* TTS button for AI messages */}
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => void handleSpeak(msg.id, msg.text)}
                      title={speakingMsgId === msg.id ? 'Zatrzymaj czytanie' : 'Przeczytaj na głos'}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                    >
                      {speakingMsgId === msg.id
                        ? <VolumeX className="h-3 w-3" />
                        : <Volume2 className="h-3 w-3" />}
                      {speakingMsgId === msg.id ? 'Czyta…' : 'Czytaj'}
                    </button>
                  )}
=======
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.text}
>>>>>>> live-hardening
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Bot className="h-4 w-4 text-slate-500" />
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
<<<<<<< HEAD
          placeholder={isTranscribing ? 'Transcribing…' : isRecording ? 'Recording… click mic to stop' : 'Ask anything career-related… (Shift+Enter for new line)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending || isTranscribing}
=======
          placeholder="Ask anything career-related… (Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
>>>>>>> live-hardening
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          style={{ lineHeight: `${LINE_HEIGHT_PX}px`, overflowY: 'hidden' }}
        />
        <Button
<<<<<<< HEAD
          variant="ghost"
          size="sm"
          onClick={toggleRecording}
          disabled={isSending || isTranscribing}
          title={isRecording ? 'Stop recording' : 'Record voice message'}
          className={`shrink-0 rounded-xl border px-3 py-2.5 transition-colors ${
            isRecording
              ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
              : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:hover:border-indigo-700'
          }`}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
=======
>>>>>>> live-hardening
          onClick={() => void handleSend()}
          disabled={isSending || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
<<<<<<< HEAD
      <p className="text-right text-xs text-slate-400">Enter to send · Shift+Enter for new line · Mic for voice</p>
=======
      <p className="text-right text-xs text-slate-400">Enter to send · Shift+Enter for new line</p>
>>>>>>> live-hardening
    </div>
  );
}
