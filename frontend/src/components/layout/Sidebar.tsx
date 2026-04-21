import { NavLink } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard, Briefcase, ClipboardList, FileText,
  MessageSquare, Mic, User, CreditCard, Settings,
  Shield, LogOut, Sparkles, Calculator, Scale, BarChart2, LineChart, Zap, FlaskConical, Handshake, Radar, Flame, HelpCircle, FolderKanban,
  GraduationCap, FolderOpen, Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { appScreens } from '@/config/appScreens';

interface NavItem {
  path: string;
  /** When set, NavLink uses `pathname` + `search` (e.g. Settings deep tab). */
  search?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  /** Extra context on hover (esp. when `label` is shortened for the sidebar). */
  title?: string;
}

const MAIN_FLOW: NavItem[] = [
  { ...appScreens.dashboard, icon: LayoutDashboard },
  { ...appScreens.profile, icon: User },
  { ...appScreens.jobs, icon: Briefcase },
  { ...appScreens.applications, icon: ClipboardList },
  {
    ...appScreens.reviewQueue,
    icon: FileText,
    title: 'Applications that need your attention — follow-ups, interviews, offers',
  },
];

const AI_GROWTH: NavItem[] = [
  { ...appScreens.assistant, icon: MessageSquare },
  { ...appScreens.interviewPractice, icon: Mic },
  { ...appScreens.coach, icon: GraduationCap },
  { ...appScreens.dailyWarmup, icon: Flame },
  { ...appScreens.negotiation, icon: Handshake },
  { ...appScreens.skills, icon: FlaskConical },
  { ...appScreens.aiAnalysis, icon: LineChart },
  { ...appScreens.casePractice, icon: FolderKanban },
  { ...appScreens.jobRadar, icon: Radar },
];

const DOCUMENTS_ONLY: NavItem[] = [{ ...appScreens.documents, icon: FolderOpen }];

const TOOLS: NavItem[] = [
  { ...appScreens.salary, icon: Calculator },
  { ...appScreens.legal, icon: Scale },
  { ...appScreens.reports, icon: BarChart2 },
];

const AUTOMATION: NavItem[] = [
  { ...appScreens.autoApply, icon: Zap },
];

const TECHNICAL: NavItem[] = [
  { ...appScreens.communityCentre, search: '?tab=privacy', icon: Users, title: 'Consent and data-sharing controls' },
  { ...appScreens.settings, icon: Settings },
  { ...appScreens.security, icon: Shield },
  { ...appScreens.billing, icon: CreditCard },
  { ...appScreens.faq, icon: HelpCircle },
];

interface NavSectionProps {
  label: string;
  items: NavItem[];
}

const NavSection = ({ label, items }: NavSectionProps) => (
  <div className="mb-4">
    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {label}
    </p>
    {items.map((item) => (
      <NavLink
        key={item.search ? `${item.path}${item.search}` : item.path}
        to={item.search ? { pathname: item.path, search: item.search.startsWith('?') ? item.search.slice(1) : item.search } : item.path}
        title={item.title}
        className={({ isActive }) =>
          clsx(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          )
        }
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            {item.badge}
          </span>
        )}
      </NavLink>
    ))}
  </div>
);

export default function Sidebar() {
  const { signOut } = useClerk();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">MultivoHub</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Career Workspace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <NavSection label="Main Flow" items={MAIN_FLOW} />
        <NavSection label="AI & Growth" items={AI_GROWTH} />
        <NavSection label="Documents" items={DOCUMENTS_ONLY} />
        <NavSection label="Tools & Insights" items={TOOLS} />
        <NavSection label="Automation" items={AUTOMATION} />
        <NavSection label="Technical & Account" items={TECHNICAL} />
      </nav>

      {/* Sign out */}
      <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
