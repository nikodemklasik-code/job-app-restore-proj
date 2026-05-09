/**
 * Employer Intelligence Zustand Store
 *
 * Client-side state for employer profiles, trust/risk scores, and signals.
 */

import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface EmployerSignal {
    id: string;
    employerId: string;
    signalType: string;
    category: string;
    score: number;
    severity: string;
    title: string;
    explanation: string;
}

interface EmployerProfile {
    id: string;
    name: string;
    normalizedName: string;
    website: string | null;
    market: string;
    signals: EmployerSignal[];
    sources: Array<{ id: string; sourceType: string; sourceName: string; confidence: number }>;
}

interface TrustRiskScores {
    employerId: string;
    employerName: string;
    trustScore: number;
    riskScore: number;
    sourceCount: number;
    signalCount: number;
}

interface EmployerIntelState {
    currentEmployer: EmployerProfile | null;
    scores: TrustRiskScores | null;
    isLoading: boolean;
    error: string | null;

    loadEmployer: (employerId: string) => Promise<void>;
    loadByName: (name: string) => Promise<void>;
    loadScores: (employerId: string) => Promise<void>;
    reportInaccuracy: (signalId: string, reason: string) => Promise<void>;
    clear: () => void;
}

export const useEmployerIntelStore = create<EmployerIntelState>((set) => ({
    currentEmployer: null,
    scores: null,
    isLoading: false,
    error: null,

    loadEmployer: async (employerId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).employerIntel.getEmployerProfile.query({ employerId });
            set({ currentEmployer: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load employer', isLoading: false });
        }
    },

    loadByName: async (name) => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).employerIntel.getEmployerByName.query({ name });
            set({ currentEmployer: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to find employer', isLoading: false });
        }
    },

    loadScores: async (employerId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await (trpcClient as any).employerIntel.getTrustRiskScores.query({ employerId });
            set({ scores: data, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load scores', isLoading: false });
        }
    },

    reportInaccuracy: async (signalId, reason) => {
        try {
            await (trpcClient as any).employerIntel.reportSignalInaccuracy.mutate({ signalId, reason });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to report inaccuracy' });
        }
    },

    clear: () => set({ currentEmployer: null, scores: null, error: null }),
}));
