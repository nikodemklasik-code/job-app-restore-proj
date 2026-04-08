import { useUser } from '@clerk/clerk-react';
import { Briefcase, TrendingUp, Calendar, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const stats = [
  { label: 'Active Applications', value: '24', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { label: 'Avg Fit Score', value: '86%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { label: 'Upcoming Interviews', value: '3', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { label: 'AI Credits', value: '1,250', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' },
];

const suggestedActions = [
  { title: 'Complete your profile', description: 'Add work experience to boost your fit scores', badge: 'Profile 75%', href: '/profile' },
  { title: 'Review 3 new matches', description: 'High-fit jobs matched in the last 24 hours', badge: '96% avg fit', href: '/review' },
  { title: 'Practice interview', description: 'You have an interview at Stripe in 2 days', badge: 'Prep now', href: '/interview' },
];

export default function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          {greeting}, {user?.firstName ?? 'there'} 👋
        </h1>
        <p className="mt-1 text-slate-500">Here's what's happening in your career workspace today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile readiness */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">75% complete</span>
                <span className="text-slate-400">4 sections missing</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: '75%' }} />
              </div>
            </div>
            <Button variant="outline" size="sm" className="ml-4" onClick={() => void navigate('/profile')}>
              Complete Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggested Actions */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
          AI Suggested Next Actions
        </h2>
        <div className="space-y-3">
          {suggestedActions.map((action) => (
            <button
              key={action.href}
              onClick={() => void navigate(action.href)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-indigo-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white">{action.title}</span>
                  <Badge variant="default">{action.badge}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
