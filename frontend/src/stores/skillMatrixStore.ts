/**
 * Skill Matrix Zustand Store
 *
 * Client-side state for skill taxonomy, evidence, signals, and readiness scores.
 */

import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface SkillOverview {
    skillId: string;
    skillName: string;
    category: string;
    readinessScore: number;
    evidenceStrength: number;
    evidenceCount: number;
    isStale: boolean;
}

interface SkillSignal {
    id: string;
    userId: string;
    skillId: string;
    signalType: string;
    title: string;
    explanation: string;
    severity: string;
}

interface SkillEvidenceRecord {
    id: string;
    userId: string;
    skillId: string;
    sourceType: string;
    evidenceType: string;
    evidenceText: string | null;
    evidenceUrl: string | null;
    occurredAt: string | null;
    confidence: number;
    verifiedByUser: boolean | null;
}

interface PortfolioOverview {
    skills: SkillOverview[];
    signals: SkillSignal[];
    totalSkills: number;
    averageReadiness: number;
}

interface SkillMatrixState {
    portfolio: PortfolioOverview | null;
    evidence: SkillEvidenceRecord[];
    signals: SkillSignal[];
    isLoading: boolean;
    error: string | null;

    loadPortfolio: () => Promise<void>;
    loadEvidence: () => Promise<void>;
    loadSignals: () => Promise<void>;
    addEvidence: (input: {
        skillId: string;
        sourceType: string;
        evidenceText: string;
        evidenceUrl?: string;
        occurredAt?: string;
    }) => Promise<void>;
    confirmEvidence: (evidenceId: string, confirmed: boolean) => Promise<void>;
}

export const useSkillMatrixStore = create<SkillMatrixState>((set, get) => ({
    portfolio: null,
    evidence: [],
    signals: [],
    isLoading: false,
    error: null,

    loadPortfolio: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).skillMatrix.getPortfolioOverview.query();
            set({ portfolio: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load portfolio', isLoading: false });
        }
    },

    loadEvidence: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).skillMatrix.getUserEvidence.query();
            set({ evidence: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load evidence', isLoading: false });
        }
    },

    loadSignals: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).skillMatrix.getUserSignals.query();
            set({ signals: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load signals', isLoading: false });
        }
    },

    addEvidence: async (input) => {
        try {
            await (trpcClient as any).skillMatrix.addEvidence.mutate(input);
            // Reload portfolio after adding evidence
            await get().loadPortfolio();
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to add evidence' });
        }
    },

    confirmEvidence: async (evidenceId, confirmed) => {
        try {
            await (trpcClient as any).skillMatrix.confirmEvidence.mutate({ evidenceId, confirmed });
            await get().loadEvidence();
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to confirm evidence' });
        }
    },
}));
