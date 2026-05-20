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
    Loader2,
    X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

type ApplicationStatus = 'draft' | 'prepared' | 'sent' | 'follow_up_sent' | 'rejected' | 'accepted' | 'interview';

type ApplicationCardProps = {
    application: any;
    userId: string;
    isSelected: boolean;
    onSelect: () => void;
    onPrepare: () => void;
    onSendEmail: () => void;
    onUpdateStatus: (status: ApplicationStatus) => void;
    isPreparing: boolean;
    isUpdating: boolean;
    isSending?: boolean;
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

function formatDate(value?: string | Date | null): string {
    if (!value) return 'No date';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ApplicationCard(props: ApplicationCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const { application } = props;
    const canSend = Boolean(props.employerEmail && props.userId && !props.isSending);
    const canPrepare = application.status === 'draft' && !props.isPreparing;
    const hasPreparedDocuments = Boolean(application.cvSnapshot || application.coverLetterSnapshot);

    return (
        <div className="relative w-full" style={{ perspective: '1000px', minHeight: '420px', height: 'auto' }}>
            <div
                className={`relative w-full transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d', minHeight: '420px' }}
            >
                <Card
                    className={`mvh-card-glow p-5 w-full overflow-auto ${isFlipped ? 'absolute inset-0 invisible' : 'relative visible'}`}
                    style={{ backfaceVisibility: 'hidden', minHeight: '420px' }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{application.jobTitle}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{application.company}</p>
                        </div>

                        <button
                            type="button"
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

                    <div className="mt-4 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <p className="font-semibold uppercase tracking-wide">Created</p>
                            <p className="mt-1">{formatDate(application.createdAt)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <p className="font-semibold uppercase tracking-wide">Updated</p>
                            <p className="mt-1">{formatDate(application.updatedAt)}</p>
                        </div>
                    </div>

                    {application.notes && (
                        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                            {application.notes}
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                        {application.status === 'draft' && (
                            <button
                                type="button"
                                onClick={props.onPrepare}
                                disabled={!canPrepare}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {props.isPreparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Prepare Documents
                            </button>
                        )}

                        {hasPreparedDocuments && (
                            <button
                                type="button"
                                onClick={() => setIsFlipped(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                            >
                                <FileText className="h-4 w-4" />
                                Review Application
                            </button>
                        )}
                    </div>
                </Card>

                <Card
                    className={`mvh-card-glow p-5 w-full overflow-auto ${isFlipped ? 'relative visible' : 'absolute inset-0 invisible'}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', minHeight: '420px' }}
                >
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{application.jobTitle}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{application.company}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFlipped(false)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <X className="h-3.5 w-3.5" />
                            Close
                        </button>
                    </div>

                    {props.jobDescription && (
                        <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {props.jobDescription}
                        </p>
                    )}

                    {hasPreparedDocuments && (
                        <div className="mb-4 grid gap-3 md:grid-cols-2">
                            {application.cvSnapshot && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">CV Snapshot</p>
                                    <p className="line-clamp-5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">{application.cvSnapshot}</p>
                                </div>
                            )}
                            {application.coverLetterSnapshot && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cover Letter Snapshot</p>
                                    <p className="line-clamp-5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">{application.coverLetterSnapshot}</p>
                                </div>
                            )}
                        </div>
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
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Body Optional</label>
                            <textarea
                                value={props.emailBody}
                                onChange={(e) => props.onEmailBodyChange(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder="Leave empty for generated message"
                            />
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Prepared CV and cover letter snapshots are attached by the backend when the email is sent.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={props.onSendEmail}
                            disabled={!canSend}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {props.isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {props.isSending ? 'Sending Application Email' : 'Send Application Email'}
                        </button>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => props.onUpdateStatus('interview')}
                                disabled={props.isUpdating || application.status === 'interview'}
                                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-60 dark:border-violet-900 dark:text-violet-300"
                            >
                                {props.isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Briefcase className="h-3.5 w-3.5" />}
                                Interview
                            </button>

                            <button
                                type="button"
                                onClick={() => props.onUpdateStatus('follow_up_sent')}
                                disabled={props.isUpdating || application.status === 'follow_up_sent'}
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-900 dark:text-blue-300"
                            >
                                <Clock3 className="h-3.5 w-3.5" />
                                Follow-Up Sent
                            </button>

                            <button
                                type="button"
                                onClick={() => props.onUpdateStatus('rejected')}
                                disabled={props.isUpdating || application.status === 'rejected'}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300"
                            >
                                <Ban className="h-3.5 w-3.5" />
                                Rejected
                            </button>

                            <button
                                type="button"
                                onClick={() => props.onUpdateStatus('accepted')}
                                disabled={props.isUpdating || application.status === 'accepted'}
                                className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-60 dark:border-green-900 dark:text-green-300"
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
