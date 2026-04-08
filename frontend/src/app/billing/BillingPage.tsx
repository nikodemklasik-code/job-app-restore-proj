import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Check, Zap, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBillingStore } from '@/stores/billingStore';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', period: '/month', credits: 100, features: ['100 AI credits/mo', 'Basic job matching', 'Profile builder', '3 CV exports'], cta: 'Current Plan', active: false },
  { id: 'pro', name: 'Pro', price: '$15', period: '/month', credits: 1000, features: ['1,000 AI credits/mo', 'Advanced job matching', 'Interview coaching', 'Unlimited CV exports', 'Priority support'], cta: 'Upgrade to Pro', active: true },
  { id: 'autopilot', name: 'Autopilot', price: '$29', period: '/month', credits: 5000, features: ['5,000 AI credits/mo', 'Auto-apply to matched jobs', 'Custom outreach templates', 'Dedicated AI coach', 'White-glove support'], cta: 'Go Autopilot', active: false },
];

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
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Billing &amp; Credits</h1>
        <p className="mt-1 text-slate-500">Manage your plan, credits, and billing history.</p>
      </div>

      {currentPlan && (
        <Card className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/20">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="text-sm text-slate-500">Current Plan</p>
              <p className="font-display text-xl font-bold text-slate-900 dark:text-white capitalize">{currentPlan.plan}</p>
              <p className="text-sm text-slate-500 mt-0.5">Renews {currentPlan.renewalDate} • <strong>{currentPlan.credits.toLocaleString()}</strong> credits remaining</p>
            </div>
            <Button variant="outline" onClick={() => { if (userId) void openCustomerPortal(userId).then((url) => { if (url) window.open(url, '_blank'); }); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={plan.active ? 'border-indigo-200 ring-2 ring-indigo-600 dark:border-indigo-800' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.active && <Badge>Popular</Badge>}
              </div>
              <div>
                <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              <p className="text-sm text-slate-500">{plan.credits.toLocaleString()} AI credits/mo</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.active ? 'default' : 'outline'}>
                <Zap className="mr-2 h-4 w-4" />
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billingHistory.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{item.plan} Plan</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">${item.amount}</p>
                    <Badge variant="success" className="text-[10px]">{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex h-16 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
