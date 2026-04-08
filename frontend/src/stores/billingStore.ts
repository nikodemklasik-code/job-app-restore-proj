import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface BillingPlan {
  plan: string;
  credits: number;
  renewalDate: string;
  status: string;
}

interface BillingHistoryItem {
  date: string;
  amount: number;
  plan: string;
  status: string;
}

interface BillingStore {
  currentPlan: BillingPlan | null;
  billingHistory: BillingHistoryItem[];
  isLoading: boolean;
  error: string | null;
  loadBillingData: (userId: string) => Promise<void>;
  createCheckoutSession: (userId: string, priceId: string, customerEmail: string) => Promise<string | null>;
  openCustomerPortal: (userId: string) => Promise<string | null>;
}

export const useBillingStore = create<BillingStore>((set) => ({
  currentPlan: null,
  billingHistory: [],
  isLoading: false,
  error: null,

  async loadBillingData(userId) {
    set({ isLoading: true, error: null });
    try {
      const [plan, history] = await Promise.all([
        trpcClient.billing.getCurrentPlan.query({ userId }),
        trpcClient.billing.getBillingHistory.query(),
      ]);
      set({ currentPlan: plan, billingHistory: history, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load billing', isLoading: false });
    }
  },

  async createCheckoutSession(userId, priceId, customerEmail) {
    try {
      const result = await trpcClient.billing.createCheckoutSession.mutate({ userId, priceId, customerEmail });
      return result.url;
    } catch {
      return null;
    }
  },

  async openCustomerPortal(userId) {
    try {
      const result = await trpcClient.billing.createCustomerPortalSession.mutate({ userId });
      return result.url;
    } catch {
      return null;
    }
  },
}));
