/**
 * Scoring Zustand Store
 *
 * Client-side state for Job Fit, Action Priority, and Market Value scores.
 */

import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface JobFitResult {
    score: number;
    perSkillContribution: Array<{
        skillId: string;
        skillName: string;
        evidenceLevel: string | null;
        contribution: number;
        matched: boolean;
    }>;
}

interface ActionPriorityResult {
    score: number;
    recommendation: 'apply_now' | 'save' | 'reject' | 'verify_employer';
    explanation: string;
    inputScores: {
        jobFit: number;
        employerTrust: number;
        employerRisk: number;
        marketValue: number;
        skillReadiness: number;
    };
}

interface MarketValueResult {
    score: number;
    lowConfidence: boolean;
}

interface ScoringState {
    jobFitScores: Record<string, JobFitResult>;
    actionPriorities: Record<string, ActionPriorityResult>;
    marketValue: MarketValueResult | null;
    isLoading: boolean;
    error: string | null;

    getJobFit: (jobId: string, requiredSkills?: Array<{ skillId: string; skillName: string; weight: number }>) => Promise<JobFitResult | null>;
    getActionPriority: (jobId: string, employerId?: string) => Promise<ActionPriorityResult | null>;
    loadMarketValue: () => Promise<void>;
    disagreeWithScore: (scoreType: string, entityId: string, reason?: string) => Promise<void>;
}

export const useScoringStore = create<ScoringState>((set, get) => ({
    jobFitScores: {},
    actionPriorities: {},
    marketValue: null,
    isLoading: false,
    error: null,

    getJobFit: async (jobId, requiredSkills) => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).scoring.getJobFit.query({ jobId, requiredSkills });
            set((state) => ({
                jobFitScores: { ...state.jobFitScores, [jobId]: data },
                isLoading: false,
            }));
            return data;
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to compute job fit', isLoading: false });
            return null;
        }
    },

    getActionPriority: async (jobId, employerId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).scoring.getActionPriority.query({ jobId, employerId });
            set((state) => ({
                actionPriorities: { ...state.actionPriorities, [jobId]: data },
                isLoading: false,
            }));
            return data;
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to compute action priority', isLoading: false });
            return null;
        }
    },

    loadMarketValue: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).scoring.getMarketValue.query();
            set({ marketValue: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load market value', isLoading: false });
        }
    },

    disagreeWithScore: async (scoreType, entityId, reason) => {
        try {
            await (trpcClient as any).scoring.disagreeWithScore.mutate({ scoreType, entityId, reason });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to submit feedback' });
        }
    },
}));
