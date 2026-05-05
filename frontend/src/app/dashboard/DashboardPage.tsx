import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardSnapshot } from '@/components/dashboard/DashboardSnapshot';
import type { DashboardSnapshot as DashboardSnapshotDto } from '@/types/dashboard';

function buildFallbackSnapshot(user: ReturnType<typeof useUser>['user']): DashboardSnapshotDto {
  const fullName = user?.fullName ?? user?.firstName ?? null;

  return {
    userId: user?.id ?? 'current-user',
    profile: {
      fullName,
      targetRole: null,
      completeness: 0,
      missingCriticalFields: ['Profile data is temporarily unavailable'],
    },
    applications: {
      total: 0,
      byStatus: {
        draft: 0,
        saved: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        archived: 0,
      },
      recent: [],
      needsReviewCount: 0,
    },
    billing: {
      currency: 'GBP',
      postedDebitCents: 0,
      postedCreditCents: 0,
      postedNetCents: 0,
      pendingDebitCents: 0,
      pendingCreditCents: 0,
      pendingNetCents: 0,
      availableBalanceCents: 0,
    },
    practice: {
      totalSessions: 0,
      completedSessions: 0,
      averageScore: null,
      lastCompletedAt: null,
    },
    nextAction: {
      label: 'Open Profile',
      href: '/profile',
      reason:
        'Dashboard data is temporarily unavailable. You can still continue from Profile, Documents, Jobs, Applications, Interview, Coach, or AI Assistant.',
    },
    generatedAt: new Date().toISOString(),
  };
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  const snapshotQuery = api.dashboard.getSnapshot.useQuery(undefined, {
    enabled: isLoaded && Boolean(user?.id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const fallbackSnapshot = useMemo(() => buildFallbackSnapshot(user), [user]);

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (snapshotQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-white/5 xl:col-span-2" />
          <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (snapshotQuery.isError) {
    return (
      <div className="space-y-4">
        <DashboardSnapshot snapshot={fallbackSnapshot} />
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-base font-semibold text-amber-100">Dashboard is using limited data</h1>
              <p className="mt-1 text-sm text-amber-100/80">
                The dashboard API returned an invalid response instead of JSON. The workspace stays usable while the
                API/proxy is corrected.
              </p>
              <p className="mt-2 text-xs text-amber-200/70">Technical detail: {snapshotQuery.error.message}</p>
            </div>
            <button
              type="button"
              onClick={() => void snapshotQuery.refetch()}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshotQuery.data) {
    return <DashboardSnapshot snapshot={fallbackSnapshot} />;
  }

  return <DashboardSnapshot snapshot={snapshotQuery.data} />;
}
