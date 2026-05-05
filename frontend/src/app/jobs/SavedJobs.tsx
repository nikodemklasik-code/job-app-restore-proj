import { api } from '@/lib/api';
import { Loader2, Bookmark } from 'lucide-react';
import { JobCardCompact } from '@/components/jobs/JobCardCompact';
import { JobCardExpanded } from '@/components/jobs/JobCardExpanded';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SavedJobs() {
  const navigate = useNavigate();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const savedJobsQuery = api.jobs.getSavedJobs.useQuery();
  const unsaveJobMutation = api.jobs.unsaveJob.useMutation({
    onSuccess: () => {
      savedJobsQuery.refetch();
      toast.success('Job removed from saved');
    },
  });

  const createApplicationMutation = api.applications.create.useMutation();
  const generateDocumentsMutation = api.applications.generateDocuments.useMutation();
  const startRadarScanMutation = api.jobRadar.startScan.useMutation();

  const handleCreateDraft = (job: any) => {
    const toastId = toast.loading('Creating draft application...');
    createApplicationMutation.mutate(
      {
        userId: job.userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        notes: `Saved job - Source: ${job.source}`,
      },
      {
        onSuccess: () => {
          toast.success('Draft created!', { id: toastId });
          navigate('/applications');
        },
        onError: (error) => {
          toast.error(`Failed: ${error.message}`, { id: toastId });
        },
      }
    );
  };

  const handleTailorResume = (job: any) => {
    const toastId = toast.loading('Creating draft and generating documents...');
    createApplicationMutation.mutate(
      {
        userId: job.userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        notes: `Saved job - Source: ${job.source}`,
      },
      {
        onSuccess: (data) => {
          generateDocumentsMutation.mutate(
            { userId: job.userId, applicationId: data.id },
            {
              onSuccess: () => {
                toast.success('Documents generated!', { id: toastId });
                navigate('/applications');
              },
              onError: (error) => {
                toast.error(`Document generation failed: ${error.message}`, { id: toastId });
                navigate('/applications');
              },
            }
          );
        },
        onError: (error) => {
          toast.error(`Failed: ${error.message}`, { id: toastId });
        },
      }
    );
  };

  const handleStartRadarScan = (job: any) => {
    const toastId = toast.loading('Starting Job Radar scan...');

    // Validate applyUrl - only send if it's a valid URL
    let validApplyUrl: string | undefined = undefined;
    if (job.applyUrl) {
      try {
        new URL(job.applyUrl);
        validApplyUrl = job.applyUrl;
      } catch {
        // Invalid URL, leave as undefined
        console.warn('Invalid applyUrl, skipping:', job.applyUrl);
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
        scanTrigger: 'manual_search',
      },
      {
        onSuccess: (data) => {
          toast.success('Scan started!', { id: toastId });
          navigate(`/jobs/radar/${data.scanId}`);
        },
        onError: (error) => {
          toast.error(`Failed: ${error.message}`, { id: toastId });
        },
      }
    );
  };

  if (savedJobsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const savedJobs = savedJobsQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-emerald-500" />
            Saved Jobs
          </h1>
          <p className="mt-1 text-slate-400">
            {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved for later
          </p>
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="h-16 w-16 text-slate-700 mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No saved jobs yet</h2>
          <p className="text-slate-500 max-w-md">
            Save jobs from the Jobs Discovery page to review them later
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {savedJobs.map((savedJob: any) => {
            const job = savedJob.job;
            const isExpanded = expandedJobId === job.id;

            return isExpanded ? (
              <JobCardExpanded
                key={job.id}
                job={job}
                isSaved={true}
                onToggleSave={() => unsaveJobMutation.mutate({ jobId: job.id })}
                onCollapse={() => setExpandedJobId(null)}
                onCreateDraft={() => handleCreateDraft(job)}
                onTailorResume={() => handleTailorResume(job)}
                onStartRadarScan={() => handleStartRadarScan(job)}
                isCreatingDraft={createApplicationMutation.isPending}
                isTailoringResume={generateDocumentsMutation.isPending}
                isStartingRadarScan={startRadarScanMutation.isPending}
              />
            ) : (
              <JobCardCompact
                key={job.id}
                job={job}
                isSaved={true}
                onToggleSave={() => unsaveJobMutation.mutate({ jobId: job.id })}
                onExpand={() => setExpandedJobId(job.id)}
                onCreateDraft={() => handleCreateDraft(job)}
                isExpanded={false}
                isCreatingDraft={createApplicationMutation.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
