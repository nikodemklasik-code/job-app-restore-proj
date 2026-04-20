/** Live job boards shown on Dashboard / Jobs (aligned with `JobsDiscovery` ALL_SOURCES). */
export const JOB_BOARD_ORDER = ['reed', 'adzuna', 'jooble', 'indeed', 'gumtree'] as const;
export type JobBoardId = (typeof JOB_BOARD_ORDER)[number];

export const JOB_BOARD_LABELS: Record<JobBoardId, string> = {
  reed: 'Reed',
  adzuna: 'Adzuna',
  jooble: 'Jooble',
  indeed: 'Indeed',
  gumtree: 'Gumtree',
};

export type SessionRow = { provider: string; isActive: boolean };

export function boardNeedsSession(id: JobBoardId): boolean {
  return id === 'indeed' || id === 'gumtree';
}

export function boardSessionActive(sessions: SessionRow[], id: JobBoardId): boolean {
  return sessions.some((s) => s.provider === id && s.isActive);
}
