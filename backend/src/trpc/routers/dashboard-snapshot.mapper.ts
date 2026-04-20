export const dashboardApplicationStatuses = [
  'draft',
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'archived',
] as const;

export type DashboardApplicationStatus = (typeof dashboardApplicationStatuses)[number];

/** Maps legacy `applications.status` varchar values to the dashboard pipeline enum. */
export function mapApplicationStatusToDashboard(raw: string | null | undefined): DashboardApplicationStatus {
  const key = (raw ?? 'draft').toLowerCase();
  const map: Record<string, DashboardApplicationStatus> = {
    draft: 'draft',
    prepared: 'saved',
    saved: 'saved',
    sent: 'applied',
    follow_up_sent: 'applied',
    applied: 'applied',
    interview: 'interview',
    accepted: 'offer',
    rejected: 'rejected',
    archived: 'archived',
  };
  return map[key] ?? 'saved';
}
