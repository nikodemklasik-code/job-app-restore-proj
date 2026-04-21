import { useState, type ComponentType } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import {
  BarChart2, Download, Loader2, TrendingUp, Users, Building2,
  ChevronRight, FileText, FileJson,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Application = {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  notes?: string | null;
  jobId?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(part: number, total: number): string {
  if (total === 0) return '0%';
  return Math.round((part / total) * 100) + '%';
}

function fmtConversion(from: number, to: number): string {
  if (from === 0) return '–';
  return Math.round((to / from) * 100) + '%';
}

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d;
}

function countInRange(apps: Application[], from: Date, to: Date): number {
  return apps.filter((a) => {
    const d = a.createdAt ? new Date(a.createdAt) : null;
    return d && d >= from && d <= to;
  }).length;
}

function detectSource(app: Application): string {
  const title = (app.jobTitle ?? '').toLowerCase();
  const notes = (app.notes ?? '').toLowerCase();
  const id = (app.jobId ?? '').toLowerCase();
  if (id.includes('reed') || notes.includes('reed') || title.includes('reed')) return 'Reed';
  if (id.includes('adzuna') || notes.includes('adzuna')) return 'Adzuna';
  if (id.includes('indeed') || notes.includes('indeed')) return 'Indeed';
  if (id.includes('gumtree') || notes.includes('gumtree')) return 'Gumtree';
  if (id.includes('linkedin') || notes.includes('linkedin')) return 'LinkedIn';
  return 'Direct / Other';
}

function appsToCSV(apps: Application[]): string {
  const headers = ['id', 'jobTitle', 'company', 'status', 'createdAt', 'updatedAt', 'notes', 'jobId'];
  const rows = apps.map((a) =>
    headers.map((h) => {
      const v = (a as Record<string, unknown>)[h];
      const str = v == null ? '' : String(v);
      // Escape quotes and wrap in quotes if contains comma/newline/quote
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, bg, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Application Funnel ────────────────────────────────────────────────────────

interface FunnelProps {
  byStatus: Record<string, number>;
  total: number;
}

function ApplicationFunnel({ byStatus, total }: FunnelProps) {
  const stages = [
    { key: 'sent', label: 'Applied', color: 'bg-indigo-500', textColor: 'text-indigo-400' },
    { key: 'interview', label: 'Interview', color: 'bg-amber-500', textColor: 'text-amber-400' },
    { key: 'accepted', label: 'Offer', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  ];

  const counts = stages.map((s) => byStatus[s.key] ?? 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Application Funnel</h2>
        <span className="text-xs text-slate-500">{total} total</span>
      </div>

      {/* Horizontal funnel bars */}
      <div className="space-y-4">
        {stages.map((stage, i) => {
          const count = counts[i];
          const widthPct = total > 0 ? Math.max(8, Math.round((count / total) * 100)) : 8;
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-300">{stage.label}</span>
                <div className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="text-xs text-slate-500">
                      {fmtConversion(counts[i - 1], count)} conversion
                    </span>
                  )}
                  <span className={`text-sm font-bold ${stage.textColor}`}>{count}</span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${stage.color}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{pct(count, total)} of all applications</p>
            </div>
          );
        })}
      </div>

      {/* Conversion arrows */}
      <div className="flex items-center gap-2 pt-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-2">
            <div className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${stage.color} text-white`}>
              {counts[i]} {stage.label}
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-slate-600" />
                <span className="text-xs text-slate-500">{fmtConversion(counts[i], counts[i + 1])}</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Also show draft/prepared/rejected */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-3">
        {[
          { key: 'draft', label: 'Draft', color: 'text-slate-400' },
          { key: 'prepared', label: 'Prepared', color: 'text-sky-400' },
          { key: 'rejected', label: 'Rejected', color: 'text-red-400' },
        ].map((s) => (
          <div key={s.key} className="text-center">
            <p className={`text-lg font-bold ${s.color}`}>{byStatus[s.key] ?? 0}</p>
            <p className="text-xs text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 30-Day Timeline ───────────────────────────────────────────────────────────

interface TimelineProps {
  apps: Application[];
}

function ActivityTimeline({ apps }: TimelineProps) {
  const now = new Date();
  const weeks = [
    { label: 'This week', from: weeksAgo(1), to: now },
    { label: '1–2 wks ago', from: weeksAgo(2), to: weeksAgo(1) },
    { label: '2–3 wks ago', from: weeksAgo(3), to: weeksAgo(2) },
    { label: '3–4 wks ago', from: weeksAgo(4), to: weeksAgo(3) },
  ];

  const counts = weeks.map((w) => countInRange(apps, w.from, w.to));
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <h2 className="font-semibold text-white">30-Day Activity Timeline</h2>
      <div className="space-y-3">
        {weeks.map((week, i) => {
          const count = counts[i];
          const barPct = Math.max(4, Math.round((count / maxCount) * 100));
          return (
            <div key={week.label} className="flex items-center gap-4">
              <span className="w-28 text-xs text-slate-400 shrink-0">{week.label}</span>
              <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                <div
                  className="h-6 bg-indigo-500/60 rounded-lg flex items-center pl-2 transition-all duration-500"
                  style={{ width: `${barPct}%` }}
                >
                  {count > 0 && <span className="text-xs font-medium text-white">{count}</span>}
                </div>
              </div>
              <span className="w-16 text-right text-xs font-medium text-slate-400">
                {count} {count === 1 ? 'app' : 'apps'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-600">Based on application creation date</p>
    </div>
  );
}

// ── Job Source Performance ────────────────────────────────────────────────────

interface SourcePerformanceProps {
  apps: Application[];
}

function SourcePerformance({ apps }: SourcePerformanceProps) {
  const sourceCounts: Record<string, number> = {};
  for (const app of apps) {
    const src = detectSource(app);
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }
  const sorted = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

  const sourceColors: Record<string, string> = {
    Reed: 'bg-red-500/70',
    Adzuna: 'bg-orange-500/70',
    Indeed: 'bg-sky-500/70',
    Gumtree: 'bg-green-500/70',
    LinkedIn: 'bg-blue-500/70',
    'Direct / Other': 'bg-slate-500/70',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <h2 className="font-semibold text-white">Job Source Performance</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No applications yet</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([source, count]) => {
            const barPct = Math.max(4, Math.round((count / maxCount) * 100));
            const color = sourceColors[source] ?? 'bg-indigo-500/70';
            return (
              <div key={source} className="flex items-center gap-4">
                <span className="w-28 text-xs text-slate-400 shrink-0 truncate">{source}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-lg overflow-hidden">
                  <div
                    className={`h-5 ${color} rounded-lg transition-all duration-500`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-medium text-slate-300">{count}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-slate-600">Source detected from job ID prefix and notes</p>
    </div>
  );
}

// ── Top Companies ─────────────────────────────────────────────────────────────

interface TopCompaniesProps {
  apps: Application[];
}

function TopCompanies({ apps }: TopCompaniesProps) {
  const companyCounts: Record<string, { count: number; statuses: string[] }> = {};
  for (const app of apps) {
    const c = app.company ?? 'Unknown';
    if (!companyCounts[c]) companyCounts[c] = { count: 0, statuses: [] };
    companyCounts[c].count += 1;
    if (!companyCounts[c].statuses.includes(app.status)) {
      companyCounts[c].statuses.push(app.status);
    }
  }
  const sorted = Object.entries(companyCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 10);

  const statusColor: Record<string, string> = {
    accepted: 'bg-emerald-500/20 text-emerald-400',
    interview: 'bg-amber-500/20 text-amber-400',
    sent: 'bg-sky-500/20 text-sky-400',
    rejected: 'bg-red-500/20 text-red-400',
    prepared: 'bg-indigo-500/20 text-indigo-400',
    draft: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-semibold text-white mb-4">Top Companies Applied To</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No applications yet</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([company, data], i) => (
            <div
              key={company}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-xs font-bold text-slate-600 w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{company}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.statuses.map((s) => (
                    <span
                      key={s}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[s] ?? 'bg-slate-500/20 text-slate-400'}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-lg font-bold text-white shrink-0">{data.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Data Export ───────────────────────────────────────────────────────────────

interface DataExportProps {
  apps: Application[];
  isLoading: boolean;
  userId: string;
}

function DataExport({ apps, isLoading, userId }: DataExportProps) {
  const [pdfError, setPdfError] = useState<string | null>(null);
  const downloadReportMutation = api.applications.downloadCandidateReport.useMutation({
    onError: (err) => setPdfError(err.message),
  });

  const handleExportJSON = () => {
    const json = JSON.stringify(apps, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(json, `applications-${date}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    const csv = appsToCSV(apps);
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(csv, `applications-${date}.csv`, 'text/csv');
  };

  async function handleDownloadPdfReport() {
    if (!userId) return;
    setPdfError(null);
    try {
      const result = await downloadReportMutation.mutateAsync({ userId });
      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-search-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // handled in onError
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex rounded-xl bg-indigo-500/10 p-2.5">
          <Download className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Data Export</h2>
          <p className="text-xs text-slate-400 mt-0.5">Download all your application data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleExportJSON}
          disabled={isLoading || apps.length === 0}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="inline-flex rounded-lg bg-amber-500/10 p-2">
            <FileJson className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Export as JSON</p>
            <p className="text-xs text-slate-500">{apps.length} applications</p>
          </div>
        </button>
        <button
          onClick={handleExportCSV}
          disabled={isLoading || apps.length === 0}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="inline-flex rounded-lg bg-emerald-500/10 p-2">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Export as CSV</p>
            <p className="text-xs text-slate-500">{apps.length} applications</p>
          </div>
        </button>
        <button
          onClick={() => void handleDownloadPdfReport()}
          disabled={isLoading || apps.length === 0 || downloadReportMutation.isPending}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="inline-flex rounded-lg bg-indigo-500/10 p-2">
            {downloadReportMutation.isPending
              ? <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
              : <FileText className="h-5 w-5 text-indigo-400" />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">PDF Report</p>
            <p className="text-xs text-slate-500">Full analytics + methodology</p>
          </div>
        </button>
      </div>

      {pdfError && (
        <p className="text-xs text-red-400 mt-3">{pdfError}</p>
      )}

      {apps.length === 0 && !isLoading && (
        <p className="text-xs text-slate-500 mt-3">No applications to export yet.</p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReportsHub() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const analyticsQuery = api.applications.getAnalytics.useQuery(
    { userId },
    { enabled: isLoaded && !!userId }
  );

  const allAppsQuery = api.applications.getAll.useQuery(
    { userId },
    { enabled: isLoaded && !!userId }
  );

  const analytics = analyticsQuery.data;
  const apps = (allAppsQuery.data ?? []) as Application[];
  const isLoading = analyticsQuery.isLoading || allAppsQuery.isLoading;
  const hasQueryError = analyticsQuery.isError || allAppsQuery.isError;

  const retryLoad = () => {
    void analyticsQuery.refetch();
    void allAppsQuery.refetch();
  };

  const analyticsIsUsable = Boolean(analytics && typeof analytics.total === 'number' && analytics.byStatus);

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        <h2 className="text-lg font-semibold">Reports unavailable</h2>
        <p className="mt-2 text-sm text-amber-200">Sign in to load analytics and reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex rounded-xl bg-indigo-500/10 p-2.5">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
        </div>
        <p className="text-slate-400 ml-14">Recruitment-process analytics for your applications pipeline, response patterns, and conversion flow.</p>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}

      {hasQueryError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300">Failed to load report data. Please try again.</p>
          <button type="button" onClick={retryLoad} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-300/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/10">Retry</button>
        </div>
      )}

      {!isLoading && analyticsIsUsable && analytics && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Applications"
              value={analytics.total}
              icon={TrendingUp}
              color="text-indigo-400"
              bg="bg-indigo-500/10"
            />
            <StatCard
              label="Interviews"
              value={analytics.interviews}
              icon={Users}
              color="text-amber-400"
              bg="bg-amber-500/10"
              sub={fmtConversion(analytics.applied, analytics.interviews) + ' from applied'}
            />
            <StatCard
              label="Offers"
              value={analytics.offers}
              icon={Building2}
              color="text-emerald-400"
              bg="bg-emerald-500/10"
              sub={fmtConversion(analytics.interviews, analytics.offers) + ' from interview'}
            />
            <StatCard
              label="Response Rate"
              value={analytics.responseRate + '%'}
              icon={BarChart2}
              color="text-sky-400"
              bg="bg-sky-500/10"
              sub="Interviews + offers / total"
            />
          </div>

          {/* Funnel + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ApplicationFunnel byStatus={analytics.byStatus} total={analytics.total} />
            <ActivityTimeline apps={apps} />
          </div>

          {/* Source + Companies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SourcePerformance apps={apps} />
            <TopCompanies apps={apps} />
          </div>

          {/* Export */}
          <DataExport apps={apps} isLoading={allAppsQuery.isLoading} userId={userId} />
        </>
      )}

      {!isLoading && !hasQueryError && analytics?.total === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <BarChart2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No data yet</h3>
          <p className="text-slate-400 text-sm">Start moving real applications through your pipeline (Applied → Interview → Offer) to unlock process analytics.</p>
        </div>
      )}


      {!isLoading && !hasQueryError && !analyticsIsUsable && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h3 className="text-base font-semibold text-amber-100">Report data is temporarily unavailable</h3>
          <p className="mt-2 text-sm text-amber-200">We received an unexpected response format. Please retry in a moment.</p>
          <button type="button" onClick={retryLoad} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10">Retry</button>
        </div>
      )}


      {!isLoading && !hasQueryError && !analyticsIsUsable && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h3 className="text-base font-semibold text-amber-100">Report data is temporarily unavailable</h3>
          <p className="mt-2 text-sm text-amber-200">We received an unexpected response format. Please retry in a moment.</p>
          <button type="button" onClick={retryLoad} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10">Retry</button>
        </div>
      )}
    </div>
  );
}
