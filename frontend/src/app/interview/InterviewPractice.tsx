import { useUser } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInterviewReadyStore } from '@/stores/interviewReadyStore';
import { Mic, MicOff, Play, SkipForward, Trophy } from 'lucide-react';

export default function InterviewPractice() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { status, error, questions, currentQuestionIndex, answers, startSession, startAnswer, finishAnswer, nextQuestion, resetSession } = useInterviewReadyStore();

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const lastAnswer = answers[answers.length - 1] ?? null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  if (!isLoaded) return null;
  if (!userId) return <div className="py-12 text-center text-slate-500">Sign in to start interview practice</div>;

  if (status === 'finished') {
    const avgScore = answers.length > 0 ? Math.round(answers.reduce((s, a) => s + a.feedback.score, 0) / answers.length) : 0;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Interview Ready</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>Session Complete</CardTitle>
                <p className="text-sm text-slate-500">Average score: <strong>{avgScore}/100</strong></p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {answers.map((ans) => (
              <div key={ans.questionId} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{ans.questionText}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={ans.feedback.score >= 80 ? 'success' : 'secondary'}>{ans.feedback.score}/100</Badge>
                  <Badge variant="outline">{ans.metrics.speakingPaceWpm} wpm</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{ans.feedback.comments}</p>
              </div>
            ))}
            <Button className="w-full" onClick={resetSession}>Start New Session</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Interview Ready</h1>
          <p className="mt-1 text-slate-500">Master your delivery with realistic AI mock sessions.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Start New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">3 behavioral questions • Standard difficulty • AI feedback after each answer</p>
            <Button size="lg" className="w-full" onClick={() => void startSession(userId)}>
              <Play className="mr-2 h-4 w-4" /> Start Mock Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Preparing your interview session...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-red-500">{error ?? 'Something went wrong'}</p>
          <Button onClick={() => void startSession(userId)}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Interview Ready</h1>
          <p className="mt-1 text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <Badge variant="secondary">{Math.round(progress)}% done</Badge>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-slate-800 dark:text-slate-200">{currentQuestion?.text}</p>

          <div className="flex gap-3">
            {status === 'asking' && (
              <Button className="flex-1" onClick={startAnswer}>
                <Mic className="mr-2 h-4 w-4" /> Start Answer
              </Button>
            )}
            {status === 'listening' && (
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => void finishAnswer(userId)}>
                <MicOff className="mr-2 h-4 w-4" /> Stop &amp; Submit
              </Button>
            )}
            {status === 'feedback' && (
              <Button className="flex-1" onClick={() => void nextQuestion()}>
                <SkipForward className="mr-2 h-4 w-4" />
                {isLastQuestion ? 'Finish Session' : 'Next Question'}
              </Button>
            )}
          </div>

          {status === 'feedback' && lastAnswer && (
            <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant={lastAnswer.feedback.score >= 80 ? 'success' : 'default'}>{lastAnswer.feedback.score}/100</Badge>
                <Badge variant="secondary">{lastAnswer.metrics.speakingPaceWpm} wpm</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{lastAnswer.feedback.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
