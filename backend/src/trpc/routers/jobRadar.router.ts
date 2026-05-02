/**
 * Job Radar tRPC Router
 * Deep employer & job post analysis endpoints
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import {
  jobRadarScans,
  jobRadarReports,
  jobRadarScores,
  jobRadarSources,
  jobRadarSignals,
  jobRadarFindings,
  jobRadarBenchmarks,
  jobRadarScoreDrivers,
} from '../../db/schema.js';
import {
  initializeJobRadarScan,
  collectJobRadarSources,
  extractJobRadarSignals,
  calculateJobRadarScores,
  generateJobRadarFindings,
  generateSalaryBenchmark,
  generateEntityFingerprint,
  type JobRadarScanInput,
  type JobRadarScanProgress,
  type JobRadarReportSummary,
} from '../../services/jobRadar/jobRadarEngine.js';

export const jobRadarRouter = router({
  /**
   * Start a new Job Radar deep scan
   */
  startScan: protectedProcedure
    .input(
      z.object({
        jobId: z.string().optional(),
        jobTitle: z.string().min(1),
        company: z.string().min(1),
        location: z.string().optional(),
        description: z.string().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        applyUrl: z.string().url().optional(),
        scanTrigger: z.enum(['saved_job', 'manual_search', 'url_input']).default('manual_search'),
      }),
    )
    .output(
      z.object({
        scanId: z.string(),
        status: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Initialize scan
      const scanInput: JobRadarScanInput = {
        userId,
        jobId: input.jobId,
        jobTitle: input.jobTitle,
        company: input.company,
        location: input.location,
        description: input.description,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        applyUrl: input.applyUrl,
        scanTrigger: input.scanTrigger,
      };

      const { scanId, idempotencyKey } = await initializeJobRadarScan(scanInput);
      const entityFingerprint = generateEntityFingerprint(scanInput);

      const progress: JobRadarScanProgress = {
        stage: 'init',
        stageState: 'processing',
        message: 'Initializing deep scan...',
        completedSteps: 0,
        totalSteps: 5,
        sourcesCollected: 0,
        signalsExtracted: 0,
      };

      // Insert scan record
      await db.insert(jobRadarScans).values({
        id: scanId,
        userId,
        jobPostId: input.jobId,
        scanTrigger: input.scanTrigger,
        status: 'processing',
        idempotencyKey,
        entityFingerprint,
        inputPayload: scanInput,
        progress,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Start async processing (in production, use queue/worker)
      processJobRadarScan(scanId, scanInput).catch((err) => {
        console.error('[jobRadar.startScan] Processing failed:', err);
      });

      return {
        scanId,
        status: 'processing',
        message: 'Deep scan started. This may take 30-60 seconds.',
      };
    }),

  /**
   * Get scan progress
   */
  getScanProgress: protectedProcedure
    .input(z.object({ scanId: z.string() }))
    .output(
      z.object({
        scanId: z.string(),
        status: z.enum(['processing', 'partial_report', 'ready', 'sources_blocked', 'scan_failed']),
        progress: z.object({
          stage: z.enum(['init', 'sources', 'parsing', 'scoring', 'report', 'done']),
          stageState: z.enum(['pending', 'processing', 'done', 'partial', 'failed']),
          message: z.string(),
          completedSteps: z.number(),
          totalSteps: z.number(),
          sourcesCollected: z.number(),
          signalsExtracted: z.number(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const scan = await db
        .select()
        .from(jobRadarScans)
        .where(and(eq(jobRadarScans.id, input.scanId), eq(jobRadarScans.userId, ctx.user.id)))
        .limit(1);

      if (!scan[0]) {
        throw new Error('Scan not found');
      }

      return {
        scanId: scan[0].id,
        status: scan[0].status,
        progress: scan[0].progress as JobRadarScanProgress,
      };
    }),

  /**
   * Get full Job Radar report
   */
  getReport: protectedProcedure
    .input(z.object({ scanId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const scan = await db
        .select()
        .from(jobRadarScans)
        .where(and(eq(jobRadarScans.id, input.scanId), eq(jobRadarScans.userId, ctx.user.id)))
        .limit(1);

      if (!scan[0]) {
        throw new Error('Scan not found');
      }

      // Get report
      const report = await db
        .select()
        .from(jobRadarReports)
        .where(eq(jobRadarReports.scanId, input.scanId))
        .limit(1);

      if (!report[0]) {
        throw new Error('Report not ready yet');
      }

      // Get scores
      const scores = await db
        .select()
        .from(jobRadarScores)
        .where(eq(jobRadarScores.scanId, input.scanId))
        .limit(1);

      // Get findings
      const findings = await db
        .select()
        .from(jobRadarFindings)
        .where(eq(jobRadarFindings.scanId, input.scanId));

      // Get benchmark
      const benchmark = await db
        .select()
        .from(jobRadarBenchmarks)
        .where(eq(jobRadarBenchmarks.scanId, input.scanId))
        .limit(1);

      // Get sources
      const sources = await db
        .select()
        .from(jobRadarSources)
        .where(eq(jobRadarSources.scanId, input.scanId));

      // Get score drivers
      const scoreDrivers = await db
        .select()
        .from(jobRadarScoreDrivers)
        .where(eq(jobRadarScoreDrivers.scanId, input.scanId));

      // Group drivers by score name
      const groupedDrivers: Record<string, { positive_drivers: any[]; negative_drivers: any[]; neutral_constraints: any[] }> = {
        employer_score: { positive_drivers: [], negative_drivers: [], neutral_constraints: [] },
        offer_score: { positive_drivers: [], negative_drivers: [], neutral_constraints: [] },
        market_pay_score: { positive_drivers: [], negative_drivers: [], neutral_constraints: [] },
        benefits_score: { positive_drivers: [], negative_drivers: [], neutral_constraints: [] },
        culture_fit_score: { positive_drivers: [], negative_drivers: [], neutral_constraints: [] },
        risk_score: { positive_drivers: [], negative_drivers: [], neutral_constraints: [] },
      };

      for (const driver of scoreDrivers) {
        const payload = {
          label: driver.label,
          impact: driver.impact,
          confidence: driver.confidence,
        };

        if (!groupedDrivers[driver.scoreName]) {
          groupedDrivers[driver.scoreName] = { positive_drivers: [], negative_drivers: [], neutral_constraints: [] };
        }

        if (driver.driverType === 'positive') {
          groupedDrivers[driver.scoreName].positive_drivers.push(payload);
        } else if (driver.driverType === 'negative') {
          groupedDrivers[driver.scoreName].negative_drivers.push(payload);
        } else {
          groupedDrivers[driver.scoreName].neutral_constraints.push(payload);
        }
      }

      const summary: JobRadarReportSummary = {
        scanId: input.scanId,
        status: report[0].status,
        employerScore: scores[0]?.employerScore ?? 0,
        offerScore: scores[0]?.offerScore ?? 0,
        marketPayScore: scores[0]?.marketPayScore ?? 0,
        benefitsScore: scores[0]?.benefitsScore ?? 0,
        cultureFitScore: scores[0]?.cultureFitScore ?? 0,
        riskScore: scores[0]?.riskScore ?? 0,
        recommendation: scores[0]?.recommendation ?? 'Mixed Signals',
        confidenceOverall: scores[0]?.confidenceOverall ?? 'low',
        keyFindings: (report[0].keyFindings as string[]) ?? [],
        redFlags: (report[0].redFlags as string[]) ?? [],
        positiveSignals: findings
          .filter((f) => f.findingType === 'positive')
          .map((f) => f.summary),
        salaryBenchmark: benchmark[0]
          ? {
            p25: Number(benchmark[0].salaryP25),
            median: Number(benchmark[0].salaryMedian),
            p75: Number(benchmark[0].salaryP75),
            currency: benchmark[0].currency,
            yourPosition: 'at' as const,
          }
          : undefined,
        freshnessStatus: report[0].freshnessStatus,
        freshnessHours: Number(report[0].freshnessHours),
        sourcesCount: sources.length,
        sourcesQuality: sources.length > 3 ? 'high' : sources.length > 1 ? 'medium' : 'low',
      };

      return {
        summary,
        report: report[0],
        scores: scores[0],
        scoreDrivers: groupedDrivers,
        findings,
        benchmark: benchmark[0],
        sources,
      };
    }),

  /**
   * Get recent scans for user
   */
  getRecentScans: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const scans = await db
        .select()
        .from(jobRadarScans)
        .where(eq(jobRadarScans.userId, ctx.user.id))
        .orderBy(desc(jobRadarScans.startedAt))
        .limit(input.limit);

      return scans.map((scan) => ({
        scanId: scan.id,
        status: scan.status,
        company: (scan.inputPayload as JobRadarScanInput).company,
        jobTitle: (scan.inputPayload as JobRadarScanInput).jobTitle,
        startedAt: scan.startedAt.toISOString(),
        completedAt: scan.completedAt?.toISOString(),
      }));
    }),

  /**
   * Get Job Radar summary for a job (if scan exists)
   */
  getJobSummary: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find most recent scan for this job
      const scan = await db
        .select()
        .from(jobRadarScans)
        .where(and(eq(jobRadarScans.userId, ctx.user.id), eq(jobRadarScans.jobPostId, input.jobId)))
        .orderBy(desc(jobRadarScans.startedAt))
        .limit(1);

      if (!scan[0]) {
        return null;
      }

      // Get scores
      const scores = await db
        .select()
        .from(jobRadarScores)
        .where(eq(jobRadarScores.scanId, scan[0].id))
        .limit(1);

      if (!scores[0]) {
        return null;
      }

      return {
        scanId: scan[0].id,
        status: scan[0].status,
        recommendation: scores[0].recommendation,
        riskScore: scores[0].riskScore,
        employerScore: scores[0].employerScore,
        freshnessHours: 0, // Calculate from scan.startedAt
      };
    }),
});

/**
 * Background processing function
 * In production, this should be a queue worker
 */
async function processJobRadarScan(scanId: string, input: JobRadarScanInput): Promise<void> {
  try {
    // Stage 1: Collect sources
    await updateScanProgress(scanId, {
      stage: 'sources',
      stageState: 'processing',
      message: 'Collecting sources...',
      completedSteps: 1,
      totalSteps: 5,
      sourcesCollected: 0,
      signalsExtracted: 0,
    });

    const sources = await collectJobRadarSources(scanId, input);

    // Insert sources
    for (const source of sources) {
      await db.insert(jobRadarSources).values(source);
    }

    await updateScanProgress(scanId, {
      stage: 'sources',
      stageState: 'done',
      message: `Collected ${sources.length} sources`,
      completedSteps: 2,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: 0,
    });

    // Stage 2: Extract signals
    await updateScanProgress(scanId, {
      stage: 'parsing',
      stageState: 'processing',
      message: 'Extracting signals...',
      completedSteps: 2,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: 0,
    });

    const signals = await extractJobRadarSignals(scanId, sources, input);

    // Insert signals
    for (const signal of signals) {
      await db.insert(jobRadarSignals).values(signal);
    }

    await updateScanProgress(scanId, {
      stage: 'parsing',
      stageState: 'done',
      message: `Extracted ${signals.length} signals`,
      completedSteps: 3,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: signals.length,
    });

    // Stage 3: Calculate scores
    await updateScanProgress(scanId, {
      stage: 'scoring',
      stageState: 'processing',
      message: 'Calculating scores...',
      completedSteps: 3,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: signals.length,
    });

    const scores = await calculateJobRadarScores(scanId, signals, input);
    await db.insert(jobRadarScores).values(scores);

    // Generate findings
    const findings = await generateJobRadarFindings(scanId, signals, scores);
    for (const finding of findings) {
      await db.insert(jobRadarFindings).values(finding);
    }

    // Generate benchmark
    const benchmark = await generateSalaryBenchmark(scanId, input);
    if (benchmark) {
      await db.insert(jobRadarBenchmarks).values(benchmark);
    }

    await updateScanProgress(scanId, {
      stage: 'scoring',
      stageState: 'done',
      message: 'Scores calculated',
      completedSteps: 4,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: signals.length,
    });

    // Stage 4: Generate report
    await updateScanProgress(scanId, {
      stage: 'report',
      stageState: 'processing',
      message: 'Generating report...',
      completedSteps: 4,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: signals.length,
    });

    const keyFindings = findings.filter((f) => f.findingType === 'positive').map((f) => f.summary);
    const redFlags = findings.filter((f) => f.findingType === 'red_flag').map((f) => f.summary);

    await db.insert(jobRadarReports).values({
      id: randomUUID(),
      scanId,
      status: 'ready',
      scoringVersion: '1.0',
      parserVersion: '1.0',
      normalizationVersion: '1.0',
      resolverVersion: '1.0',
      freshnessStatus: 'fresh',
      freshnessHours: '0',
      lastScannedAt: new Date(),
      autoRescanEligible: true,
      rescanRecommended: false,
      confidenceSummary: { overall: scores.confidenceOverall },
      missingData: [],
      keyFindings,
      redFlags,
      nextBestAction: null,
      benchmarkProvenance: null,
      overrideApplied: false,
      summaryJson: { scores, findings: findings.length },
      detailsJson: { signals: signals.length, sources: sources.length },
      sourcesJson: sources.map((s) => ({ type: s.sourceType, url: s.sourceUrl })),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mark scan as complete
    await db
      .update(jobRadarScans)
      .set({
        status: 'ready',
        completedAt: new Date(),
        lastUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobRadarScans.id, scanId));

    await updateScanProgress(scanId, {
      stage: 'done',
      stageState: 'done',
      message: 'Report ready',
      completedSteps: 5,
      totalSteps: 5,
      sourcesCollected: sources.length,
      signalsExtracted: signals.length,
    });
  } catch (error) {
    console.error('[processJobRadarScan] Error:', error);

    await db
      .update(jobRadarScans)
      .set({
        status: 'scan_failed',
        failedReason: error instanceof Error ? error.message : 'Unknown error',
        lastUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobRadarScans.id, scanId));

    await updateScanProgress(scanId, {
      stage: 'done',
      stageState: 'failed',
      message: 'Scan failed',
      completedSteps: 0,
      totalSteps: 5,
      sourcesCollected: 0,
      signalsExtracted: 0,
    });
  }
}

async function updateScanProgress(scanId: string, progress: JobRadarScanProgress): Promise<void> {
  await db
    .update(jobRadarScans)
    .set({
      progress,
      lastUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jobRadarScans.id, scanId));
}
