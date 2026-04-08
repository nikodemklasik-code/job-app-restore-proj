import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { Check, Zap, ExternalLink, Loader2, CreditCard } from 'lucide-react';
import { useBillingStore } from '@/stores/billingStore';
import { trpcClient } from '@/lib/api';

type PaymentMethod = 'stripe' | 'paypal';

const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: import.meta.env.VITE_STRIPE_PRO_PRICE_ID ?? '',
  autopilot: import.meta.env.VITE_STRIPE_AUTOPILOT_PRICE_ID ?? '',
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    'Basic job matching',
    'Profile builder',
    'CV upload',
    'Up to 10 applications',
  ],
  pro: [
    'Unlimited applications',
    'AI-generated documents',
    'Indeed session integration',
    'Interview practice',
    'Skills Lab',
    'Style Studio',
    'Salary Calculator',
  ],
  autopilot: [
    'Everything in Pro',
    'Auto-apply to matched jobs',
    'Telegram notifications',
    'Follow-up email copilot',
  ],
};

const PLANS = [
  { id: 'free', name: 'Free', price: '£0', period: '/month', highlighted: false },
  { id: 'pro', name: 'Pro', price: '£9.99', period: '/month', highlighted: true },
  { id: 'autopilot', name: 'Autopilot', price: '£24.99', period: '/month', highlighted: false },
] as const;

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '';
  const { currentPlan, billingHistory, isLoading, loadBillingData, openCustomerPortal } = useBillingStore();

  const [searchParams] = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [capturingPayPal, setCapturingPayPal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadBillingData(userId);
  }, [isLoaded, userId, loadBillingData]);

  // Handle PayPal return from redirect
  useEffect(() => {
    if (!userId) return;
    const paypalStatus = searchParams.get('paypal');
    const token = searchParams.get('token'); // PayPal order token

    if (paypalStatus === 'success' && token) {
      const plan = (searchParams.get('plan') ?? 'pro') as 'pro' | 'autopilot';
      setCapturingPayPal(true);
      trpcClient.billing.capturePayPalOrder
        .mutate({ userId, orderId: token, plan })
        .then(() => {
          setStatusMessage({ type: 'success', text: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated via PayPal!` });
          void loadBillingData(userId);
        })
        .catch((err: unknown) => {
          setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'PayPal capture failed.' });
        })
        .finally(() => setCapturingPayPal(false));
    } else if (paypalStatus === 'cancel') {
      setStatusMessage({ type: 'error', text: 'PayPal payment cancelled.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpgrade = async (planId: 'pro' | 'autopilot') => {
    if (!userId || !userEmail) return;
    setUpgradingPlan(planId);
    setStatusMessage(null);
    try {
      if (paymentMethod === 'paypal') {
        const { approveUrl } = await trpcClient.billing.createPayPalOrder.mutate({ userId, plan: planId });
        // Append plan to return URL so we know which plan to activate on capture
        const url = new URL(approveUrl);
        // PayPal return_url is set server-side, but we store plan in localStorage as fallback
        localStorage.setItem('paypal_pending_plan', planId);
        window.location.href = url.toString();
      } else {
        const priceId = STRIPE_PRICE_IDS[planId];
        if (!priceId) {
          setStatusMessage({ type: 'error', text: 'Stripe price not configured. Contact support.' });
          return;
        }
        const { url } = await trpcClient.billing.createCheckoutSession.mutate({ userId, priceId, customerEmail: userEmail });
        window.location.href = url;
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upgrade failed.' });
    } finally {
      setUpgradingPlan(null);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing &amp; Credits</h1>
        <p className="mt-1 text-slate-400">Manage your plan, credits, and billing history.</p>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`rounded-xl px-5 py-3 text-sm font-medium ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* PayPal capture in progress */}
      {capturingPayPal && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-5 py-3 text-sm text-amber-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirming your PayPal payment…
        </div>
      )}

      {/* Current plan card */}
      {currentPlan && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Current Plan</p>
              <p className="text-xl font-bold text-white capitalize">{currentPlan.plan}</p>
              <p className="text-sm text-slate-400">
                Renews {currentPlan.renewalDate}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{currentPlan.credits.toLocaleString()}</span>
                <span className="text-sm text-slate-400">AI credits remaining</span>
              </div>
              {PLAN_FEATURES[currentPlan.plan] && (
                <ul className="mt-3 space-y-1">
                  {PLAN_FEATURES[currentPlan.plan].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => {
                if (userId) {
                  void openCustomerPortal(userId).then((url) => {
                    if (url) window.open(url, '_blank');
                  });
                }
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Subscription
            </button>
          </div>
        </div>
      )}

      {/* Payment method toggle */}
      {currentPlan?.plan !== 'autopilot' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Pay with:</span>
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                paymentMethod === 'stripe'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Card (Stripe)
            </button>
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                paymentMethod === 'paypal'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
              </svg>
              PayPal
            </button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan?.plan === plan.id;
          const canUpgrade = plan.id !== 'free' && !isCurrentPlan;
          const isUpgrading = upgradingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`flex flex-col gap-4 rounded-2xl border bg-white/5 p-6 ${
                plan.highlighted
                  ? 'border-indigo-500/50 ring-2 ring-indigo-600/30'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
                    Popular
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    Active
                  </span>
                )}
              </div>

              <div>
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>

              <ul className="flex-1 space-y-2">
                {PLAN_FEATURES[plan.id]?.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {canUpgrade ? (
                <button
                  disabled={isUpgrading}
                  onClick={() => void handleUpgrade(plan.id as 'pro' | 'autopilot')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isUpgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isUpgrading ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400">
                  {isCurrentPlan ? 'Current Plan' : 'Free — no action needed'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Billing history */}
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
                  <p className="text-sm font-semibold text-white">£{item.amount}</p>
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
