import { createHash } from 'node:crypto';

export type SourceCluster = {
  clusterId: string;
  primarySourceId: string;
  sourceIds: string[];
  reason: 'same_content_hash' | 'same_normalized_url' | 'similar_title';
};

type SourceRow = Record<string, unknown>;

function tierOf(s: SourceRow): number {
  const t = s.sourceQualityTier;
  return typeof t === 'number' ? t : Number(t ?? 9);
}

function collectedMs(s: SourceRow): number {
  const d = s.collectedAt;
  if (!d) return 0;
  const t = d instanceof Date ? d.getTime() : new Date(String(d)).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Prefer lower tier (more authoritative), then newer collection time. */
function sortPrimary(a: SourceRow, b: SourceRow): number {
  const ta = tierOf(a);
  const tb = tierOf(b);
  if (ta !== tb) return ta - tb;
  return collectedMs(b) - collectedMs(a);
}

function normalizeTitle(s: SourceRow): string {
  const t = String(s.title ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return t.slice(0, 200);
}

/**
 * Groups duplicate sources within a scan: same normalized content hash, then same normalized URL,
 * then very similar titles (MVP: exact normalized title match).
 */
export class SourceDedupService {
  async deduplicate(sources: SourceRow[]): Promise<SourceCluster[]> {
    const clusters: SourceCluster[] = [];
    const clustered = new Set<string>();

    const byContentHash = new Map<string, SourceRow[]>();
    for (const source of sources) {
      const h = source.contentHash;
      if (typeof h === 'string' && h.length > 0) {
        const list = byContentHash.get(h) ?? [];
        list.push(source);
        byContentHash.set(h, list);
      }
    }

    for (const [contentHash, group] of byContentHash.entries()) {
      if (group.length < 2) continue;
      const sorted = [...group].sort(sortPrimary);
      const primary = sorted[0];
      const pid = String(primary.id);
      const ids = sorted.map((s) => String(s.id));
      ids.forEach((id) => clustered.add(id));

      clusters.push({
        clusterId: `cluster_${contentHash.slice(0, 16)}`,
        primarySourceId: pid,
        sourceIds: ids,
        reason: 'same_content_hash',
      });
    }

    const remainder = sources.filter((s) => !clustered.has(String(s.id)));

    const byNormUrl = new Map<string, SourceRow[]>();
    for (const source of remainder) {
      const u = source.normalizedUrl;
      if (typeof u === 'string' && u.trim().length > 0) {
        const key = u.trim();
        const list = byNormUrl.get(key) ?? [];
        list.push(source);
        byNormUrl.set(key, list);
      }
    }

    for (const [urlKey, group] of byNormUrl.entries()) {
      if (group.length < 2) continue;
      const sorted = [...group].sort(sortPrimary);
      const primary = sorted[0];
      const hashBasis = createHash('sha256').update(urlKey).digest('hex').slice(0, 24);
      clusters.push({
        clusterId: `cluster_url_${hashBasis}`,
        primarySourceId: String(primary.id),
        sourceIds: sorted.map((s) => String(s.id)),
        reason: 'same_normalized_url',
      });
      sorted.forEach((s) => clustered.add(String(s.id)));
    }

    const remainder2 = sources.filter((s) => !clustered.has(String(s.id)));

    const byTitle = new Map<string, SourceRow[]>();
    for (const source of remainder2) {
      const nt = normalizeTitle(source);
      if (nt.length < 8) continue;
      const list = byTitle.get(nt) ?? [];
      list.push(source);
      byTitle.set(nt, list);
    }

    for (const [, group] of byTitle.entries()) {
      if (group.length < 2) continue;
      const sorted = [...group].sort(sortPrimary);
      const primary = sorted[0];
      const basis = normalizeTitle(primary).slice(0, 24).replace(/\W/g, '_') || 'title';
      clusters.push({
        clusterId: `cluster_title_${basis}_${String(primary.id).slice(0, 8)}`,
        primarySourceId: String(primary.id),
        sourceIds: sorted.map((s) => String(s.id)),
        reason: 'similar_title',
      });
    }

    return clusters;
  }
}
