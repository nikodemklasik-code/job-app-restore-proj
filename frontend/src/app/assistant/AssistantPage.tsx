import { useState } from 'react';
import { Send, Bot, User, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCareerAssistantStore } from '@/stores/careerAssistantStore';

const QUICK_ACTIONS: { prompt: string; mode: string }[] = [
  { prompt: 'Review my CV for a Senior Frontend role', mode: 'cv' },
  { prompt: 'Write a cover letter for Stripe', mode: 'general' },
  { prompt: 'How should I negotiate salary?', mode: 'salary' },
  { prompt: 'Prepare me for a system design interview', mode: 'system_design' },
  { prompt: 'Walk me through completing my profile step by step', mode: 'onboarding' },
];

const MODE_LABELS: Record<string, string> = {
  general: 'General',
  cv: 'CV',
  interview: 'Interview',
  salary: 'Salary',
  system_design: 'System design',
  onboarding: 'Profile onboarding',
};

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const { messages, isSending, error, activeMode, sendMessage, clearMessages } = useCareerAssistantStore();

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">AI Career Assistant</h1>
          <p className="mt-1 text-slate-500">Your personal career strategist powered by GPT-4o.</p>
          <p className="mt-1 text-xs text-slate-400">
            Mode: <span className="font-medium text-slate-600 dark:text-slate-300">{MODE_LABELS[activeMode] ?? activeMode}</span>
            {' · '}
            Career-focused chat with topic boundaries (see system prompt on backend).
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearMessages}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950">
              <Bot className="h-7 w-7 text-indigo-600" />
            </div>
            <p className="text-slate-500">Career, CV, interviews — follow-up messages keep conversation context.</p>
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
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {msg.role === 'user'
                    ? <User className="h-4 w-4 text-white" />
                    : <Bot className="h-4 w-4 text-slate-500" />
                  }
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>
                  {msg.text}
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
                      <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Ask anything career-related; replies use chat history…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
          className="flex-1"
        />
        <Button onClick={() => void handleSend()} disabled={isSending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
