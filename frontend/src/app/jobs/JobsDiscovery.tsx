import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpcClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building2, DollarSign } from 'lucide-react';

interface JobItem {
  id: string;
  title: string;
  company: string;
  fit: number;
}

export default function JobsDiscovery() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let active = true;
    setIsLoading(true);
    void trpcClient.jobs.search.query({ query: search })
      .then((result) => { if (active) { setJobs(result); setError(null); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Failed'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isLoaded, userId, search]);

  if (!isLoaded) return <div className="flex h-48 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  if (!userId) return <div className="py-12 text-center text-slate-500">Sign in to browse jobs</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Jobs Discovery</h1>
        <p className="mt-1 text-slate-500">Find your next opportunity with AI-powered matching.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title, company, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="group cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <Badge variant={job.fit >= 90 ? 'success' : 'default'}>
                    {job.fit}% Fit
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base">{job.title}</CardTitle>
                <p className="text-sm text-slate-500">{job.company}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Remote</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> $120k–$160k</span>
                </div>
                <Button size="sm" className="w-full">Apply Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
