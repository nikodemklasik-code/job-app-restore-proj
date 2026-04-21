import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardSnapshot } from '@/components/dashboard/DashboardSnapshot';
import PhaseReadinessChecklist from '@/features/product-core/components/PhaseReadinessChecklist';
import IntelligenceReadinessPanel from '@/features/product-intelligence/components/IntelligenceReadinessPanel';
import GovernanceReadinessPanel from '@/features/product-governance/components/GovernanceReadinessPanel';
import { PHASE_5_6_MODULES } from '@/config/phase56Readiness';
import { PHASE_7_8_READINESS } from '@/config/phase78Readiness';
import { PHASE_9_10_READINESS } from '@/config/phase910Readiness';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  const snapshotQuery = api.dashboard.getSnapshot.useQuery(undefined, {
    enabled: isLoaded && Boolean(user?.id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

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
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-semibold text-red-100">Dashboard failed to load</h1>
        <p className="mt-2 text-sm text-red-200/90">{snapshotQuery.error.message}</p>
        <button
          type="button"
          onClick={() => void snapshotQuery.refetch()}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!snapshotQuery.data) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold text-white">Dashboard is empty</h1>
        <p className="mt-2 text-sm text-slate-400">A snapshot is not available for this account yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSnapshot snapshot={snapshotQuery.data} />
      <div className="grid gap-4 lg:grid-cols-3">
        <PhaseReadinessChecklist title="Phase 5-6 readiness" modules={PHASE_5_6_MODULES} />
        <IntelligenceReadinessPanel modules={PHASE_7_8_READINESS} />
        <GovernanceReadinessPanel modules={PHASE_9_10_READINESS} />
      </div>
    </div>
  );
}
