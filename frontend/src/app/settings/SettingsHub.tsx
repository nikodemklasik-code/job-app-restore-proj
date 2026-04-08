import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CreditCard, Bell, Plug, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSettingsStore } from '@/stores/settingsStore';

const QUICK_LINKS = [
  { label: 'Security & Passkeys', icon: Shield, href: '/security' },
  { label: 'Billing & Credits', icon: CreditCard, href: '/billing' },
];

export default function SettingsHub() {
  const navigate = useNavigate();
  const { emailNotifications, jobSources, loadSettings, toggleEmailNotifications, toggleJobSource } = useSettingsStore();

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-slate-500">Configure your workspace, integrations and preferences.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email">Email &amp; SMTP</TabsTrigger>
          <TabsTrigger value="sources">Job Sources</TabsTrigger>
          <TabsTrigger value="readiness">System Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Quick links */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => void navigate(link.href)}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-indigo-100 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                    <link.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Email notifications</p>
                    <p className="text-xs text-slate-500">Receive updates about jobs, interviews and alerts</p>
                  </div>
                  <button
                    onClick={toggleEmailNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email &amp; SMTP Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Configure your outgoing email settings for automated follow-ups and cover letters.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {['Gmail / Google Workspace', 'Microsoft 365', 'Custom SMTP'].map((provider) => (
                  <button key={provider} className="rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-indigo-100 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{provider}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Click to configure</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Job Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{source.name}</p>
                    <p className="text-xs text-slate-400">{source.connected ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <button
                    onClick={() => toggleJobSource(source.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${source.connected ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${source.connected ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle>System Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Profile', value: 75, status: 'In Progress' },
                { label: 'Email Integration', value: 100, status: 'Ready' },
                { label: 'Job Sources', value: 40, status: 'Partial' },
                { label: 'CV Upload', value: 0, status: 'Missing' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-400">{item.status}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${item.value === 100 ? 'bg-emerald-500' : item.value > 0 ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
