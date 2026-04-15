import { useState } from 'react';
import { ComplaintsTable } from '@/features/job-radar/admin/complaints-table';
import { ComplaintDetailPanel } from '@/features/job-radar/admin/complaint-detail-panel';
import { KillSwitchPanel } from '@/features/job-radar/admin/kill-switch-panel';
import { AdminGuard } from '@/features/job-radar/admin/admin-guard';
import type { AdminComplaintItem } from '@/features/job-radar/api/job-radar.types';

export default function JobRadarAdminComplaintsPage() {
  const [selected, setSelected] = useState<AdminComplaintItem | null>(null);

  return (
    <AdminGuard>
      {(items) => (
        <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <ComplaintsTable items={items} onSelect={setSelected} />
          </div>

          <div className="space-y-6">
            <ComplaintDetailPanel complaint={selected} />
            <KillSwitchPanel />
          </div>
        </main>
      )}
    </AdminGuard>
  );
}
