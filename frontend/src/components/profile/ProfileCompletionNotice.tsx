import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { AiProfileCriticalField, IncompleteProfileResponse } from '../../../../shared/profileCompletion';

const FIELD_LABELS: Record<AiProfileCriticalField, string> = {
  targetRole: 'Target role',
  targetSalary: 'Target salary',
  skills: 'Skills',
  experience: 'Experience',
};

export function ProfileCompletionNotice({ response }: { response: IncompleteProfileResponse }) {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-amber-50">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-amber-100">Complete your profile to unlock personalised AI</h3>
          <p className="mt-1 text-sm leading-6 text-amber-50/85">{response.message}</p>
          {response.missingCriticalFields.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {response.missingCriticalFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full border border-amber-200/30 bg-black/10 px-2.5 py-1 text-xs font-semibold text-amber-100"
                >
                  {FIELD_LABELS[field]}
                </span>
              ))}
            </div>
          ) : null}
          <Link
            to="/profile"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Open Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
