import { useState } from 'react';
import {
    FileText,
    Send,
    Clock3,
    CheckCircle2,
    Ban,
    Briefcase,
    Sparkles,
    Eye,
    Mail,
    Loader2,
    X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

type ApplicationCardProps = {
    application: any;
    userId: string;
    isSelected: boolean;
    onSelect: () => void;
    onPrepare: () => void;
    onSendEmail: () => void;
    onUpdateStatus: (status: 'draft' | 'prepared' | 'sent' | 'follow_up_sent' | 'rejected' | 'accepted' | 'interview') => void;
    isPreparing: boolean;
    isUpdating: boolean;
    emailSubject: string;
    emailBody: string;
    employerEmail: string;
    onEmailSubjectChange: (value: string) => void;
    onEmailBodyChange: (value: string) => void;
    onEmployerEmailChange: (value: string) => void;
    jobDescription?: string;
};

function statusBadge(status: string) {
    const map: Record<string, string> = {
        draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        prepared: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        follow_up_sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        interview: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
        rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        accepted: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        draft: 'Draft',
        prepared: 'Prepared',
        sent: 'Sent',
        follow_up_sent: 'Follow-Up Sent',
        interview: 'Interview',
        rejected: 'Rejected',
        accepted: 'Accepted',
    };
    return map[status] ?? status;
}

function statusIcon(status: string) {
    if (status === 'sent') return <Send className="h-3.5 w-3.5" />;
    if (status === 'follow_up_sent') return <Clock3 className="h-3.5 w-3.5" />;
    if (status === 'interview') return <Briefcase className="h-3.5 w-3.5" />;
    if (status === 'rejected') return <Ban className="h-3.5 w-3.5" />;
    if (status === 'accepted') return <CheckCircle2 className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
}

export function ApplicationCard(props: ApplicationCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const { application } = props;

    return (
        <div className="relative" style={{ perspective: '1000px', minHeight: isFlipped ? '320px' : 'auto' }}>
            <div
                className={`relative transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d', minHeight: 'inherit' }}
            >
                {/* FRONT SIDE */}
                <Card
                    className={`mvh-card-glow p-5 ${isFlipped ? 'invisible' : 'visible'}`}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{application.jobTitle}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{application.company}</p>
                        </div>

                        <button
                            onClick={() => setIsFlipped(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Open
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(application.status)}`}>
                            {statusIcon(application.status)}
                            {statusLabel(application.status)}
                        </span>

                        {typeof application.fitScore === 'number' && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {application.fitScore}% fit
                            </span>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {application.status === 'draft' && (
                            <button
                                onClick={props.onPrepare}
                                disabled={props.isPreparing}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {props.isPreparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Prepare Documents
                            </button>
                        )}

                        {application.status === 'prepared' && application.cvSnapshot && (
                            <button
                                onClick={() => {
                                    // Open CV in new tab - will be implemented
                                    alert('View CV feature coming soon');
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                            >
                                <FileText className="h-4 w-4" />
                                View CV
                            </button>
                        )}
                    </div>
                </Card>

                {/* BACK SIDE */}
                <Card
                    className={`mvh-card-glow p-5 absolute inset-0 ${isFlipped ? 'visible' : 'invisible'}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{application.jobTitle}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{application.company}</p>
                        </div>

                        <button
                            onClick={() => setIsFlipped(false)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <X className="h-3.5 w-3.5" />
                            Close
                        </button>
                    </div>

                    {props.jobDescription && (
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                            {props.jobDescription}
                        </p>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Employer Email</label>
                            <input
                                value={props.employerEmail}
                                onChange={(e) => props.onEmployerEmailChange(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder="employer@company.com"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                            <input
                                value={props.emailSubject}
                                onChange={(e) => props.onEmailSubjectChange(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder={`Application for ${application.jobTitle}`}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Body (Optional)</label>
                            <textarea
                                value={props.emailBody}
                                onChange={(e) => props.onEmailBodyChange(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder="Leave empty for AI-generated message"
                            />
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                If empty, AI generates professional message. CV & Cover Letter (tailored to this job, signed with your name) are auto-attached as PDFs.
                            </p>
                        </div>

                        <button
                            onClick={props.onSendEmail}
                            disabled={!props.employerEmail || !props.userId}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            Send Application Email
                        </button>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                onClick={() => props.onUpdateStatus('interview')}
                                disabled={props.isUpdating}
                                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300"
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                Interview
                            </button>

                            <button
                                onClick={() => props.onUpdateStatus('rejected')}
                                disabled={props.isUpdating}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                            >
                                <Ban className="h-3.5 w-3.5" />
                                Rejected
                            </button>

                            <button
                                onClick={() => props.onUpdateStatus('accepted')}
                                disabled={props.isUpdating}
                                className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-300"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Accepted
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
