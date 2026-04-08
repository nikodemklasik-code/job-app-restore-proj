import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpcClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApplicationItem {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
}

const STATUS_COLUMNS = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;

const statusBadgeVariant = (status: string): 'default' | 'success' | 'destructive' | 'secondary' => {
  if (status === 'Offer') return 'success';
  if (status === 'Rejected') return 'destructive';
  if (status === 'Interview') return 'default';
  return 'secondary';
};

export default function ApplicationsPipeline() {
  const { user, isLoaded } = useUser();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    void trpcClient.applications.getAll.query()
      .then(setApplications)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed'));
  }, [isLoaded, user?.id]);

  if (!isLoaded) return <div className="flex h-48 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Applications Pipeline</h1>
        <p className="mt-1 text-slate-500">Track every stage of your job search.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATUS_COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col);
          return (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{col}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800">
                  {colApps.length}
                </span>
              </div>
              {colApps.map((app) => (
                <Card key={app.id}>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm">{app.jobTitle}</CardTitle>
                    <p className="text-xs text-slate-500">{app.company}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-3">
                    <Badge variant={statusBadgeVariant(app.status)}>{app.status}</Badge>
                  </CardContent>
                </Card>
              ))}
              {colApps.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-100 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
                  No applications
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
