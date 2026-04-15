import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
<<<<<<< HEAD
import { Check, X, Zap, ExternalLink, Loader2, CreditCard, Heart, Bitcoin, Coins } from 'lucide-react';
=======
import { Check, Zap, ExternalLink, Loader2, CreditCard, Heart, Bitcoin } from 'lucide-react';
>>>>>>> live-hardening
import { useBillingStore } from '@/stores/billingStore';
import { trpcClient } from '@/lib/api';

type PaymentMethod = 'stripe' | 'paypal' | 'crypto';

<<<<<<< HEAD
=======
// Coinbase Commerce hosted payment links (configured per plan)
>>>>>>> live-hardening
const COINBASE_LINKS: Record<string, string> = {
  pro: import.meta.env.VITE_COINBASE_PRO_LINK ?? 'https://commerce.coinbase.com/checkout/multivohub-pro',
  autopilot: import.meta.env.VITE_COINBASE_AUTOPILOT_LINK ?? 'https://commerce.coinbase.com/checkout/multivohub-autopilot',
};

const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: import.meta.env.VITE_STRIPE_PRO_PRICE_ID ?? '',
  autopilot: import.meta.env.VITE_STRIPE_AUTOPILOT_PRICE_ID ?? '',
};

<<<<<<< HEAD
// Plan rank: higher = more features
const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, autopilot: 2 };

const PLANS = [
  { id: 'free',      name: 'Free',      price: '£0',     period: '/month', highlighted: false },
  { id: 'pro',       name: 'Pro',       price: '£9.99',  period: '/month', highlighted: true  },
  { id: 'autopilot', name: 'Autopilot', price: '£24.99', period: '/month', highlighted: false },
] as const;

// Feature comparison matrix — null = not in plan, true = included, string = note
const COMPARISON_ROWS: { label: string; free: string | boolean | null; pro: string | boolean | null; autopilot: string | boolean | null }[] = [
  { label: 'Profile builder',           free: true,   pro: true,  autopilot: true  },
  { label: 'CV upload',                 free: true,   pro: true,  autopilot: true  },
  { label: 'Job listings',              free: true,   pro: true,  autopilot: true  },
  { label: 'Applications (max)',        free: '10',   pro: '∞',   autopilot: '∞'   },
  { label: 'AI credits / month',        free: '500',  pro: '5 000', autopilot: '∞' },
  { label: 'AI-generated documents',    free: null,   pro: true,  autopilot: true  },
  { label: 'Interview practice',        free: null,   pro: true,  autopilot: true  },
  { label: 'Negotiation Coach',         free: null,   pro: true,  autopilot: true  },
  { label: 'Skills Lab',                free: null,   pro: true,  autopilot: true  },
  { label: 'Style Studio',              free: null,   pro: true,  autopilot: true  },
  { label: 'Salary Calculator',         free: null,   pro: true,  autopilot: true  },
  { label: 'Auto-apply to matched jobs',free: null,   pro: null,  autopilot: true  },
  { label: 'Telegram notifications',    free: null,   pro: null,  autopilot: true  },
  { label: 'Follow-up email copilot',   free: null,   pro: null,  autopilot: true  },
];

function Cell({ value }: { value: string | boolean | null }) {
  if (value === null) return <X className="mx-auto h-4 w-4 text-slate-600" />;
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  return <span className="text-xs font-medium text-slate-300">{value}</span>;
}

=======
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

>>>>>>> live-hardening
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
<<<<<<< HEAD
  const [copySuccess, setCopySuccess] = useState(false);
=======
>>>>>>> live-hardening

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadBillingData(userId);
  }, [isLoaded, userId, loadBillingData]);

<<<<<<< HEAD
  // Handle PayPal return
  useEffect(() => {
    if (!userId) return;
    const paypalStatus = searchParams.get('paypal');
    const token = searchParams.get('token');
=======
  // Handle PayPal return from redirect
  useEffect(() => {
    if (!userId) return;
    const paypalStatus = searchParams.get('paypal');
    const token = searchParams.get('token'); // PayPal order token

>>>>>>> live-hardening
    if (paypalStatus === 'success' && token) {
      const plan = (searchParams.get('plan') ?? 'pro') as 'pro' | 'autopilot';
      setCapturingPayPal(true);
      trpcClient.billing.capturePayPalOrder
        .mutate({ userId, orderId: token, plan })
        .then(() => {
          setStatusMessage({ type: 'success', text: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated via PayPal!` });
          void loadBillingData(userId);
        })
<<<<<<< HEAD
        .catch(() => setStatusMessage({ type: 'error', text: 'Payment capture failed. Please contact support.' }))
=======
        .catch((_err: unknown) => {
          setStatusMessage({ type: 'error', text: 'Payment capture failed. Please contact support.' });
        })
>>>>>>> live-hardening
        .finally(() => setCapturingPayPal(false));
    } else if (paypalStatus === 'cancel') {
      setStatusMessage({ type: 'error', text: 'PayPal payment cancelled.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpgrade = async (planId: 'pro' | 'autopilot') => {
    if (!userId || !userEmail) return;
<<<<<<< HEAD
    if (paymentMethod === 'crypto') {
      window.open(COINBASE_LINKS[planId], '_blank', 'noopener,noreferrer');
      setStatusMessage({ type: 'success', text: 'Opening Coinbase Commerce… complete payment there and your plan will activate within 10 minutes.' });
      return;
    }
=======

    // Crypto: redirect to Coinbase Commerce (no backend call needed)
    if (paymentMethod === 'crypto') {
      const link = COINBASE_LINKS[planId];
      window.open(link, '_blank', 'noopener,noreferrer');
      setStatusMessage({ type: 'success', text: 'Opening Coinbase Commerce… complete payment there and your plan will activate within 10 minutes.' });
      return;
    }

>>>>>>> live-hardening
    setUpgradingPlan(planId);
    setStatusMessage(null);
    try {
      if (paymentMethod === 'paypal') {
        const { approveUrl } = await trpcClient.billing.createPayPalOrder.mutate({ userId, plan: planId });
        localStorage.setItem('paypal_pending_plan', planId);
        window.location.href = new URL(approveUrl).toString();
      } else {
        const priceId = STRIPE_PRICE_IDS[planId];
<<<<<<< HEAD
        if (!priceId) { setStatusMessage({ type: 'error', text: 'This plan is not available right now. Please contact support.' }); return; }
=======
        if (!priceId) {
          setStatusMessage({ type: 'error', text: 'This plan is not available right now. Please contact support.' });
          return;
        }
>>>>>>> live-hardening
        const { url } = await trpcClient.billing.createCheckoutSession.mutate({ userId, priceId, customerEmail: userEmail });
        window.location.href = url;
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Upgrade failed. Please try again or contact support.' });
    } finally {
      setUpgradingPlan(null);
    }
  };

<<<<<<< HEAD
  const currentRank = PLAN_RANK[currentPlan?.plan ?? 'free'] ?? 0;

  if (!isLoaded) return null;

  const referralLink = `https://jobs.multivohub.com/ref/${userId?.slice(0, 8) ?? 'YOUR_CODE'}`;

=======
  if (!isLoaded) return null;

>>>>>>> live-hardening
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing &amp; Credits</h1>
        <p className="mt-1 text-slate-400">Manage your plan, credits, and billing history.</p>
      </div>

<<<<<<< HEAD
      {statusMessage && (
        <div className={`rounded-xl px-5 py-3 text-sm font-medium ${statusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
=======
      {/* Status message */}
      {statusMessage && (
        <div className={`rounded-xl px-5 py-3 text-sm font-medium ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
>>>>>>> live-hardening
          {statusMessage.text}
        </div>
      )}

<<<<<<< HEAD
=======
      {/* PayPal capture in progress */}
>>>>>>> live-hardening
      {capturingPayPal && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-5 py-3 text-sm text-amber-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirming your PayPal payment…
        </div>
      )}

<<<<<<< HEAD
      {/* Current plan — compact banner */}
      {currentPlan && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Current plan</span>
              <p className="text-lg font-bold text-white capitalize leading-tight">{currentPlan.plan}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-2xl font-bold text-white">{currentPlan.credits.toLocaleString()}</span>
              <span className="ml-1.5 text-sm text-slate-400">AI credits</span>
            </div>
            {currentPlan.renewalDate && (
              <>
                <div className="h-8 w-px bg-white/10" />
                <span className="text-sm text-slate-400">Renews {currentPlan.renewalDate}</span>
              </>
            )}
          </div>
          <button
            onClick={() => { if (userId) void openCustomerPortal(userId).then((url) => { if (url) window.open(url, '_blank'); }); }}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Manage
          </button>
        </div>
      )}

      {/* Payment method toggle — only show when upgrade is possible */}
      {currentRank < PLAN_RANK['autopilot'] && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-400">Pay with:</span>
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1 flex-wrap">
            <button onClick={() => setPaymentMethod('stripe')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${paymentMethod === 'stripe' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <CreditCard className="h-4 w-4" />
              Card / Apple Pay / Google Pay
            </button>
            <button onClick={() => setPaymentMethod('paypal')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${paymentMethod === 'paypal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" /></svg>
              PayPal
            </button>
            <button onClick={() => setPaymentMethod('crypto')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${paymentMethod === 'crypto' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}>
=======
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
            <button
              onClick={() => setPaymentMethod('crypto')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                paymentMethod === 'crypto'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
>>>>>>> live-hardening
              <Bitcoin className="h-4 w-4" />
              Crypto
            </button>
          </div>
<<<<<<< HEAD
          {paymentMethod === 'stripe' && (
            <p className="text-xs text-slate-500">Card, Apple Pay &amp; Google Pay available at checkout via Stripe.</p>
          )}
          {paymentMethod === 'crypto' && (
            <p className="text-xs text-amber-400/80">BTC, ETH, USDC via Coinbase Commerce. Activates within 10 min.</p>
=======
          {paymentMethod === 'crypto' && (
            <p className="text-xs text-amber-400/80">
              BTC, ETH, USDC accepted via Coinbase Commerce. Plan activates within 10 min of confirmation.
            </p>
>>>>>>> live-hardening
          )}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan?.plan === plan.id;
<<<<<<< HEAD
          const planRank = PLAN_RANK[plan.id] ?? 0;
          const isUpgrade = planRank > currentRank;
          const isDowngrade = planRank < currentRank && plan.id !== 'free';
          const isUpgrading = upgradingPlan === plan.id;

          return (
            <div key={plan.id}
              className={`flex flex-col gap-4 rounded-2xl border bg-white/5 p-6 ${
                plan.highlighted ? 'border-indigo-500/50 ring-2 ring-indigo-600/30' : 'border-white/10'
              }`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{plan.name}</h3>
                {plan.highlighted && !isCurrentPlan && (
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">Popular</span>
                )}
                {isCurrentPlan && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Active</span>
=======
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
>>>>>>> live-hardening
                )}
              </div>

              <div>
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>

              <ul className="flex-1 space-y-2">
<<<<<<< HEAD
                {(plan.id === 'free' ? ['Basic job matching', 'Profile builder', 'CV upload', 'Up to 10 applications'] :
                  plan.id === 'pro' ? ['Unlimited applications', 'AI-generated documents', 'Interview practice', 'Skills Lab', 'Style Studio', 'Salary Calculator'] :
                  ['Everything in Pro', 'Auto-apply to matched jobs', 'Telegram notifications', 'Follow-up email copilot']
                ).map((f) => (
=======
                {PLAN_FEATURES[plan.id]?.map((f) => (
>>>>>>> live-hardening
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

<<<<<<< HEAD
              {isCurrentPlan ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400">
                  Current Plan
                </div>
              ) : isUpgrade ? (
                <button disabled={isUpgrading} onClick={() => void handleUpgrade(plan.id as 'pro' | 'autopilot')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">
                  {isUpgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {isUpgrading ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                </button>
              ) : plan.id === 'free' ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400">
                  Free — no action needed
                </div>
              ) : isDowngrade ? (
                <button onClick={() => { if (userId) void openCustomerPortal(userId).then((url) => { if (url) window.open(url, '_blank'); }); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 transition">
                  <ExternalLink className="h-4 w-4" />
                  Downgrade in portal
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400">
                  —
=======
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
>>>>>>> live-hardening
                </div>
              )}
            </div>
          );
        })}
      </div>

<<<<<<< HEAD
      {/* ── Buy Credits ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-amber-500/15 p-2.5">
            <Coins className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Buy Extra Credits</h2>
            <p className="text-sm text-slate-400">Top up any time — credits never expire and stack with your monthly allowance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {([
            { credits: '1 000', price: '£2', desc: 'Small top-up', priceId: import.meta.env.VITE_STRIPE_CREDITS_1000 ?? '', popular: false },
            { credits: '5 000', price: '£8', desc: 'Most popular', priceId: import.meta.env.VITE_STRIPE_CREDITS_5000 ?? '', popular: true },
            { credits: '15 000', price: '£20', desc: 'Best value', priceId: import.meta.env.VITE_STRIPE_CREDITS_15000 ?? '', popular: false },
          ] as const).map((pkg) => (
            <div key={pkg.credits}
              className={`relative flex flex-col gap-4 rounded-2xl border p-5 ${pkg.popular ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-white/10 bg-white/[0.03]'}`}
              style={pkg.popular ? { background: 'rgba(251,191,36,0.06)' } : undefined}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold text-black">Most popular</span>
              )}
              <div>
                <p className="text-2xl font-bold text-white">{pkg.credits}</p>
                <p className="text-xs text-slate-500">AI credits</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-amber-400">{pkg.price}</span>
                  <span className="text-xs text-slate-500">one-time</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{pkg.desc}</p>
              </div>
              {pkg.priceId ? (
                <button
                  onClick={async () => {
                    if (!userId || !userEmail) return;
                    try {
                      const { url } = await trpcClient.billing.createCheckoutSession.mutate({ userId, priceId: pkg.priceId, customerEmail: userEmail });
                      window.location.href = url;
                    } catch {
                      setStatusMessage({ type: 'error', text: 'Could not start checkout. Please try again.' });
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  <CreditCard className="h-4 w-4" />
                  Buy {pkg.credits} credits
                </button>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-slate-500">
                  Set <code className="mx-1 text-amber-400">VITE_STRIPE_CREDITS_*</code> to enable
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 text-center">Credits are added instantly after payment · No subscriptions · Works with any plan</p>
      </div>

      {/* Plan comparison table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Plan Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-3 text-xs text-slate-400 font-medium w-1/2">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className={`text-center px-4 py-3 text-xs font-medium ${currentPlan?.plan === p.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {p.name}
                    {currentPlan?.plan === p.id && <span className="ml-1 text-[10px] text-emerald-400">●</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-6 py-2.5 text-slate-300">{row.label}</td>
                  <td className="px-4 py-2.5 text-center"><Cell value={row.free} /></td>
                  <td className="px-4 py-2.5 text-center"><Cell value={row.pro} /></td>
                  <td className="px-4 py-2.5 text-center"><Cell value={row.autopilot} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual plans coming soon */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Annual &amp; Long-Term Plans</h2>
=======
      {/* Annual / longer-term plans — coming soon */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">📅 Annual &amp; Long-Term Plans</h2>
>>>>>>> live-hardening
            <p className="mt-0.5 text-sm text-slate-400">Save more with quarterly, semi-annual and annual billing — launching soon.</p>
          </div>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">Coming Soon</span>
        </div>
<<<<<<< HEAD
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {([
            { label: 'Quarterly', saving: 'Save ~10%', period: 'every 3 months' },
            { label: 'Semi-Annual', saving: 'Save ~15%', period: 'every 6 months' },
            { label: 'Annual', saving: 'Save ~20%', period: 'per year' },
          ] as const).map((item) => (
            <div key={item.label} className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 opacity-60">
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-sm text-slate-400">{item.period}</p>
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">{item.saving}</span>
              <div className="mt-auto flex items-center justify-center rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-500">
=======

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              { label: 'Quarterly', saving: 'Save ~10%', period: 'every 3 months' },
              { label: 'Semi-Annual', saving: 'Save ~15%', period: 'every 6 months' },
              { label: 'Annual', saving: 'Save ~20%', period: 'per year' },
            ] as const
          ).map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 opacity-60"
            >
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-sm text-slate-400">{item.period}</p>
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                {item.saving}
              </span>
              <div className="mt-auto flex items-center justify-center rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-500"
                title="This billing period will be available soon. Sign up for notifications below.">
>>>>>>> live-hardening
                Notify me when available →
              </div>
            </div>
          ))}
        </div>
<<<<<<< HEAD
=======
        <p className="text-xs text-slate-500 text-center">
          Want to be notified when annual plans launch?{' '}
          <a href="mailto:hello@multivohub.com?subject=Annual plan notification" className="text-indigo-400 hover:underline">
            Let us know →
          </a>
        </p>
>>>>>>> live-hardening
      </div>

      {/* Billing history */}
      {billingHistory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-semibold text-white">Billing History</h2>
          <div className="space-y-3">
            {billingHistory.map((item, idx) => (
<<<<<<< HEAD
              <div key={`${item.date}-${idx}`} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
=======
              <div
                key={`${item.date}-${idx}`}
                className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0"
              >
>>>>>>> live-hardening
                <div>
                  <p className="text-sm font-medium text-white capitalize">{item.plan} Plan</p>
                  <p className="text-xs text-slate-500">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">£{item.amount}</p>
<<<<<<< HEAD
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">{item.status}</span>
=======
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {item.status}
                  </span>
>>>>>>> live-hardening
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Patronage */}
=======
      {/* Patronage section - 3 tiers, 3 payment methods */}
>>>>>>> live-hardening
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-rose-500/10 p-2.5">
            <Heart className="h-5 w-5 text-rose-400" />
          </div>
          <div>
<<<<<<< HEAD
            <h2 className="font-semibold text-white">Support MultivoHub</h2>
            <p className="text-sm text-slate-400">Help keep this platform free for job seekers in difficult situations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {([
            { id: 'supporter', name: 'Supporter', price: '£3', cta: 'Buy us a coffee', description: 'Helps cover API costs' },
            { id: 'patron',    name: 'Patron',    price: '£7', cta: 'Become a Patron', description: 'Keeps 5 free users running' },
            { id: 'champion',  name: 'Champion',  price: '£15', cta: 'Champion the Cause', description: 'Sponsors a job seeker in difficulty' },
          ] as const).map((tier) => (
            <div key={tier.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
=======
            <h2 className="font-semibold text-white">☕ Support MultivoHub</h2>
            <p className="text-sm text-slate-400">Help keep this platform free for job seekers in difficult situations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(
            [
              {
                id: 'supporter',
                name: 'Supporter',
                price: '£3',
                cta: 'Buy us a coffee',
                description: 'Helps cover API costs',
              },
              {
                id: 'patron',
                name: 'Patron',
                price: '£7',
                cta: 'Become a Patron',
                description: 'Keeps 5 free users running',
              },
              {
                id: 'champion',
                name: 'Champion',
                price: '£15',
                cta: 'Champion the Cause',
                description: 'Sponsors a job seeker in difficulty',
              },
            ] as const
          ).map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
>>>>>>> live-hardening
              <div>
                <p className="font-semibold text-white">{tier.name}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{tier.price}</span>
                  <span className="text-xs text-slate-400">/month or one-time</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{tier.description}</p>
              </div>
<<<<<<< HEAD
              <div className="flex flex-col gap-2">
                <a href={`https://buy.stripe.com/multivohub-${tier.id}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-medium text-white transition hover:bg-indigo-700">
                  <CreditCard className="h-3.5 w-3.5" />
                  Card / Apple Pay / Google Pay
                </a>
                <a href={`https://www.paypal.com/donate?hosted_button_id=multivohub_${tier.id}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white transition hover:bg-white/10">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" /></svg>
                  PayPal
                </a>
                <a href={`https://commerce.coinbase.com/checkout/multivohub-${tier.id}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20">
=======

              <div className="flex flex-col gap-2">
                {/* Card / Stripe */}
                <a
                  href={`https://buy.stripe.com/multivohub-${tier.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Card (Stripe)
                </a>

                {/* PayPal */}
                <a
                  href={`https://www.paypal.com/donate?hosted_button_id=multivohub_${tier.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                  </svg>
                  PayPal
                </a>

                {/* Ko-fi */}
                <a
                  href="https://ko-fi.com/multivohub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-white transition"
                  style={{ backgroundColor: '#F06622' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.025 1.476 2.896 2.464 2.884.95-.01 3.396 0 3.396 0s-.016.025-.02.031c-.658 1.049-1.327 2.007-2.116 2.803-.461.461 0 .736.463.736h.003c1.278 0 2.497-.913 2.978-1.352.624-.573 1.182-1.282 1.65-1.906.469.626 1.027 1.334 1.65 1.906.481.44 1.7 1.352 2.978 1.352h.003c.463 0 .924-.275.463-.736-.789-.796-1.458-1.754-2.116-2.803-.004-.006-.02-.031-.02-.031s2.446-.01 3.396 0c.988.012 2.3-.859 2.464-2.884.06-4.498-.022-11.822-.022-11.822zM16.1 13.645c0 .607-.501 1.1-1.117 1.1H8.017c-.616 0-1.117-.493-1.117-1.1V9.744c0-.607.501-1.1 1.117-1.1h6.966c.616 0 1.117.493 1.117 1.1v3.901zm5.13-.786c-.42.596-1.009.882-1.748.85l-.003-.001V9.59c.739-.032 1.328.254 1.748.85.643.912.643 2.527 0 3.42z" />
                  </svg>
                  Ko-fi
                </a>

                {/* Bitcoin / Crypto */}
                <a
                  href={`https://commerce.coinbase.com/checkout/multivohub-${tier.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20"
                >
>>>>>>> live-hardening
                  <Bitcoin className="h-3.5 w-3.5" />
                  Bitcoin / Crypto
                </a>
              </div>
            </div>
          ))}
        </div>
<<<<<<< HEAD
        <p className="text-center text-xs text-slate-500">100% of patronage goes to platform costs and supporting users who cannot afford Pro</p>
      </div>

      {/* Refer a Friend */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
        <h3 className="text-lg font-semibold text-white">Refer a Friend</h3>
        <p className="mt-1 text-sm text-slate-400">
          For every friend who signs up and buys any plan — you get <strong className="text-white">1 month free</strong>.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input readOnly value={referralLink}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300" />
          <button
            onClick={() => {
              void navigator.clipboard.writeText(referralLink);
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2000);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition min-w-[80px]"
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
=======

        <p className="text-center text-xs text-slate-500">
          100% of patronage goes to platform costs and supporting users who cannot afford Pro
        </p>
>>>>>>> live-hardening
      </div>

      {isLoading && (
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  );
}
