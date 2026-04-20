export type BlockableJobFields = {
  title: string;
  company: string | null;
  description: string | null;
  seniority: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
};

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase();
}

/**
 * Returns true when any user-configured blocked area (substring) matches title, company, or tags.
 */
export function isBlockedJob(job: BlockableJobFields, blockedAreas: string[]): boolean {
  if (!blockedAreas.length) return false;
  const hayTitle = norm(job.title);
  const hayCompany = norm(job.company);
  const hayDesc = norm(job.description);
  const hayTags = job.tags.map((t) => norm(t)).join(' ');
  for (const raw of blockedAreas) {
    const needle = norm(raw).trim();
    if (!needle) continue;
    if (hayTitle.includes(needle)) return true;
    if (hayCompany.includes(needle)) return true;
    if (hayDesc.includes(needle)) return true;
    if (hayTags.includes(needle)) return true;
  }
  return false;
}
