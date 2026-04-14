import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  XCircle,
  CheckCircle2,
  Briefcase,
  TrendingUp,
  Users,
  Award,
  X,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

type ApplicationStatus = 'Sent' | 'Interview' | 'Rejected' | 'Offer';

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  status: ApplicationStatus;
  dateSent: string;
}

// ─── mock data (replace with api.applications.list when endpoint exists) ──────

const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    company: 'Acme Corp',
    jobTitle: 'Senior Frontend Developer',
    status: 'Interview',
    dateSent: '2026-04-10',
  },
  {
    id: '2',
    company: 'Globex Inc',
    jobTitle: 'Full Stack Engineer',
    status: 'Rejected',
    dateSent: '2026-04-05',
  },
  {
    id: '3',
    company: 'Initech Solutions',
    jobTitle: 'React Developer',
    status: 'Sent',
    dateSent: '2026-04-13',
  },
];

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const configs: Record<ApplicationStatus, { icon: React.ReactNode; classes: string }> = {
    Sent: {
      icon: <Send className="h-3 w-3" />,
      classes: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    },
    Interview: {
      icon: <Users className="h-3 w-3" />,
      classes: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    },
    Rejected: {
      icon: <XCircle className="h-3 w-3" />,
      classes: 'bg-red-500/15 border-red-500/30 text-red-400',
    },
    Offer: {
      icon: <Award className="h-3 w-3" />,
      classes: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
  };
  const { icon, classes } = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {icon}
      {status}
    </span>
  );
}

// ─── stats row ────────────────────────────────────────────────────────────────

function StatsRow({ applications }: { applications: Application[] }) {
  const total = applications.length;
  const interviews = applications.filter((a) => a.status === 'Interview' || a.status === 'Offer').length;
  const offers = applications.filter((a) => a.status === 'Offer').length;
  const responseRate = total === 0 ? 0 : Math.round((interviews / total) * 100);

  const stats = [
    { label: 'Total Sent', value: total.toString(), icon: <Send className="h-5 w-5 text-blue-400" /> },
    { label: 'Response Rate', value: `${responseRate}%`, icon: <TrendingUp className="h-5 w-5 text-indigo-400" /> },
    { label: 'Interviews', value: interviews.toString(), icon: <Users className="h-5 w-5 text-indigo-400" /> },
    { label: 'Offers', value: offers.toString(), icon: <Award className="h-5 w-5 text-emerald-400" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
            {stat.icon}
          </div>
          <span className="text-2xl font-bold text-white">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ask AI modal ─────────────────────────────────────────────────────────────

function AskAIModal({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(
    `Why was my application for ${application.jobTitle} at ${application.company} rejected?`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Ask AI About Rejection</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {application.company} — {application.jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask AI why you were rejected..."
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            onClick={onClose}
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── application card ─────────────────────────────────────────────────────────

function ApplicationCard({
  application,
  onAskAI,
}: {
  application: Application;
  onAskAI: (app: Application) => void;
}) {
  const formattedDate = new Date(application.dateSent).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <Briefcase className="h-5 w-5 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{application.company}</p>
          <p className="truncate text-sm text-slate-400">{application.jobTitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden text-xs text-slate-500 sm:block">{formattedDate}</span>
        <StatusBadge status={application.status} />
        {application.status === 'Rejected' && (
          <button
            onClick={() => onAskAI(application)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Ask AI why
          </button>
        )}
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-4">
        <Briefcase className="h-7 w-7 text-slate-500" />
      </div>
      <p className="font-medium text-slate-300">No applications yet.</p>
      <p className="mt-1 text-sm text-slate-500">Start applying from Job Listings.</p>
      <Link
        to="/jobs"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Browse Jobs
      </Link>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ReviewQueue() {
  const [askAITarget, setAskAITarget] = useState<Application | null>(null);

  // When api.applications.list is available, replace MOCK_APPLICATIONS with the query result
  const applications = MOCK_APPLICATIONS;

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <CheckCircle2 className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Applications Review</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Track your applications and understand what's working.
          </p>
        </div>
      </div>

      {/* stats */}
      <StatsRow applications={applications} />

      {/* cards list */}
      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onAskAI={setAskAITarget}
            />
          ))}
        </div>
      )}

      {/* modal */}
      {askAITarget && (
        <AskAIModal
          application={askAITarget}
          onClose={() => setAskAITarget(null)}
        />
      )}
    </div>
  );
}
