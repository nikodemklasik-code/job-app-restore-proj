import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import toast from '@/lib/toast';
import { JobsLifecycleTabs } from '@/features/jobs/JobsLifecycleTabs';
import { Loader2, Bookmark, RotateCcw } from 'lucide-react';
import { JobCardCompact } from '@/components/jobs/JobCardCompact';
import { JobCardExpanded } from '@/components/jobs/JobCardExpanded';

export default function SavedJobs() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const savedJobsQuery = api.jobs.getSavedJobs.useQuery(undefined, { enabled: isLoaded && !!userId });
  const unsaveJobMutation = api.jobs.unsaveJob.useMutation();
  const createApplicationMutation = api.applications.create.useMutation();
  const generateDocumentsMutation = api.applications.generateDocuments.useMutation();
  const startRadarScanMutation = api.jobRadar.startScan.useMutation();

  const isBusy = unsaveJobMutation.isPending || createApplicationMutation.isPending || generateDocumentsMutation.isPending || startRadarScanMutation.isPending;

  function requireUser(): boolean {
    if (userId) return true;
    toast.error('Sign in to manage saved jobs.');
    return false;
  }

  const handleUnsave = (job: any) => {
    if (!requireUser()) return;
    setActiveJobId(job.id);
    const toastId = toast.loading('Removing saved job…');
    unsaveJobMutation.mutate(
      { jobId: job.id },
      {
        onSuccess: () => {
          toast.success('Job removed from Saved.', { id: toastId });
          void savedJobsQuery.refetch();
        },
        onError: (error) => toast.error(`Could not unsave job: ${error.message}`, { id: toastId }),
        onSettled: () => setActiveJobId(null),
      },
    );
  };

  const handleCreateDraft = (job: any) => {
    if (!requireUser()) return;
    setActiveJobId(job.id);
    const toastId = toast.loading('Creating application draft…');
    createApplicationMutation.mutate(
      {
        userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        notes: `Created from Saved Jobs. Source: ${job.source ?? 'unknown'}`,
      },
      {
        onSuccess: () => {
          toast.success('Draft created in Applications.', { id: toastId });
          navigate('/applications?status=draft');
        },
        onError: (error) => toast.error(`Could not create draft: ${error.message}`, { id: toastId }),
        onSettled: () => setActiveJobId(null),
      },
    );
  };

  const handleTailorResume = (job: any) => {
    if (!requireUser()) return;
    setActiveJobId(job.id);
    const toastId = toast.loading('Creating draft and preparing documents…');
    createApplicationMutation.mutate(
      {
        userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        notes: `Created from Saved Jobs. Source: ${job.source ?? 'unknown'}`,
      },
      {
        onSuccess: (data) => {
          generateDocumentsMutation.mutate(
            { userId, applicationId: data.id },
            {
              onSuccess: () => {
                toast.success('Draft and documents ready in Applications.', { id: toastId });
                navigate('/applications?status=prepared');
              },
              onError: (error) => {
                toast.error(`Draft created, but document preparation failed: ${error.message}`, { id: toastId });
                navigate('/applications?status=draft');
              },
              onSettled: () => setActiveJobId(null),
            },
          );
        },
        onError: (error) => {
          toast.error(`Could not create draft: ${error.message}`, { id: toastId });
          setActiveJobId(null);
        },
      },
    );
  };

  const handleStartRadarScan = (job: any) => {
    if (!requireUser()) return;
    setActiveJobId(job.id);
    const toastId = toast.loading('Opening Job Radar insight…');

    let validApplyUrl: string | undefined;
    if (job.applyUrl) {
      try {
        validApplyUrl = new URL(job.applyUrl).toString();
      } catch {
        validApplyUrl = undefined;
      }
    }

    startRadarScanMutation.mutate(
      {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salaryMin: job.salaryMin ?? undefined,
        salaryMax: job.salaryMax ?? undefined,
        applyUrl: validApplyUrl,
        scanTrigger: 'saved_job',
      },
      {
        onSuccess: (data) => {
          toast.success('Radar insight started.', { id: toastId });
          navigate(`/jobs/radar/${data.scanId}`);
        },
        onError: (error) => toast.error(`Could not open radar: ${error.message}`, { id: toastId }),
        onSettled: () => setActiveJobId(null),
      },
    );
  };

  if (!isLoaded || savedJobsQuery.isLoading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  if (!userId) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">Sign in to view saved jobs.</div>;
  }

  const savedJobs = savedJobsQuery.data || [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <Bookmark className="h-8 w-8 text-emerald-400" />
              Saved Jobs
            </h1>
            <p className="mt-1 text-slate-400">
              {savedJobs.length} saved lead{savedJobs.length === 1 ? '' : 's'} ready for Radar or an application draft.
            </p>
          </div>
          <JobsLifecycleTabs />
        </div>
      </section>

      {savedJobsQuery.isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Could not load saved jobs.</span>
            <button type="button" onClick={() => void savedJobsQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-semibold hover:bg-red-500/30">
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] py-20 text-center">
          <Bookmark className="mb-4 h-16 w-16 text-slate-700" />
          <h2 className="mb-2 text-xl font-semibold text-slate-300">No saved jobs yet</h2>
          <p className="max-w-md text-slate-500">Save jobs from Search first. Then run Radar or create an application draft from here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {savedJobs.map((savedJob: any) => {
            const job = savedJob.job;
            const isExpanded = expandedJobId === job.id;
            const isActive = activeJobId === job.id && isBusy;

            return isExpanded ? (
              <JobCardExpanded
                key={job.id}
                job={job}
                isSaved={true}
                onToggleSave={() => handleUnsave(job)}
                onCollapse={() => setExpandedJobId(null)}
                onCreateDraft={() => handleCreateDraft(job)}
                onTailorResume={() => handleTailorResume(job)}
                onStartRadarScan={() => handleStartRadarScan(job)}
                isCreatingDraft={isActive && createApplicationMutation.isPending}
                isTailoringResume={isActive && (createApplicationMutation.isPending || generateDocumentsMutation.isPending)}
                isStartingRadarScan={isActive && startRadarScanMutation.isPending}
              />
            ) : (
              <JobCardCompact
                key={job.id}
                job={job}
                isSaved={true}
                onToggleSave={() => handleUnsave(job)}
                onExpand={() => setExpandedJobId(job.id)}
                onCreateDraft={() => handleCreateDraft(job)}
                isExpanded={false}
                isCreatingDraft={isActive && createApplicationMutation.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
