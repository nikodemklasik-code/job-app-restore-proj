import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Check, Zap, ExternalLink, Loader2 } from 'lucide-react';
import { useBillingStore } from '@/stores/billingStore';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    credits: 100,
    features: ['100 AI credits/mo', 'Basic job matching', 'Profile builder', '3 CV exports'],
    cta: 'Current Plan',
    active: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$15',
    period: '/month',
    credits: 1000,
    features: ['1,000 AI credits/mo', 'Advanced job matching', 'Interview coaching', 'Unlimited CV exports', 'Priority support'],
    cta: 'Upgrade to Pro',
    active: true,
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    price: '$29',
    period: '/month',
    credits: 5000,
    features: ['5,000 AI credits/mo', 'Auto-apply to matched jobs', 'Custom outreach templates', 'Dedicated AI coach', 'White-glove support'],
    cta: 'Go Autopilot',
    active: false,
  },
] as const;

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { currentPlan, billingHistory, isLoading, loadBillingData, openCustomerPortal } = useBillingStore();

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadBillingData(userId);
  }, [isLoaded, userId, loadBillingData]);

  if (!isLoaded) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing &amp; Credits</h1>
        <p className="mt-1 text-slate-400">Manage your plan, credits, and billing history.</p>
      </div>

      {currentPlan && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Current Plan</p>
            <p className="text-xl font-bold text-white capitalize">{currentPlan.plan}</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Renews {currentPlan.renewalDate} &middot; <strong className="text-white">{currentPlan.credits.toLocaleString()}</strong> credits remaining
            </p>
          </div>
          <button
            onClick={() => {
              if (userId) {
                void openCustomerPortal(userId).then((url) => {
                  if (url) window.open(url, '_blank');
                });
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Manage Subscription
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border bg-white/5 p-6 flex flex-col gap-4 ${
              plan.active
                ? 'border-indigo-500/50 ring-2 ring-indigo-600/30'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{plan.name}</h3>
              {plan.active && (
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
                  Popular
                </span>
              )}
            </div>
            <div>
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              <span className="text-slate-400">{plan.period}</span>
              <p className="mt-1 text-sm text-slate-500">{plan.credits.toLocaleString()} AI credits/mo</p>
            </div>
            <ul className="flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                plan.active
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Zap className="h-4 w-4" />
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {billingHistory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-semibold text-white">Billing History</h2>
          <div className="space-y-3">
            {billingHistory.map((item, idx) => (
              <div
                key={`${item.date}-${idx}`}
                className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-white capitalize">{item.plan} Plan</p>
                  <p className="text-xs text-slate-500">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">${item.amount}</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  );
}
