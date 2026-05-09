/**
 * SkillsLabWithMatrix — wraps the existing SkillsLab with a tab for the
 * new Skills & Employer Verification Matrix portfolio view.
 */

import { useState } from 'react';
import { FlaskConical, BarChart3, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { SkillPortfolioView } from '@/components/skills/SkillPortfolioView';
import { useSkillMatrixStore } from '@/stores/skillMatrixStore';
import { trpcClient } from '@/lib/api';

type Tab = 'lab' | 'matrix';

// Lazy import the existing SkillsLab to avoid circular deps
import { default as SkillsLabPage } from './SkillsLabSuccessFirst';

export default function SkillsLabWithMatrix() {
    const [activeTab, setActiveTab] = useState<Tab>('matrix');
    const [syncing, setSyncing] = useState(false);

    const handleSyncFromProfile = async () => {
        setSyncing(true);
        try {
            await (trpcClient as any).skillMatrix.syncFromLegacySkills?.mutate?.();
            // Reload portfolio after sync
            useSkillMatrixStore.getState().loadPortfolio();
        } catch (err) {
            console.error('Sync failed:', err);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/10">
                <button
                    type="button"
                    onClick={() => setActiveTab('matrix')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'matrix'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700',
                    )}
                >
                    <BarChart3 className="w-4 h-4" />
                    Skills Matrix
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('lab')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'lab'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700',
                    )}
                >
                    <FlaskConical className="w-4 h-4" />
                    Skills Lab
                </button>

                {/* Sync button */}
                {activeTab === 'matrix' && (
                    <button
                        type="button"
                        onClick={handleSyncFromProfile}
                        disabled={syncing}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={clsx('w-3.5 h-3.5', syncing && 'animate-spin')} />
                        {syncing ? 'Syncing...' : 'Sync from profile'}
                    </button>
                )}
            </div>

            {/* Tab content */}
            {activeTab === 'matrix' ? (
                <SkillPortfolioView />
            ) : (
                <SkillsLabPage />
            )}
        </div>
    );
}
