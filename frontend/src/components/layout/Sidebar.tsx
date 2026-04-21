import { NavLink } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard, Briefcase, ClipboardList, FileText,
  MessageSquare, Mic, User, CreditCard, Settings,
  Shield, LogOut, Sparkles, Calculator, Scale, BarChart2, LineChart, Zap, FlaskConical, Handshake, Radar, Flame, HelpCircle, FolderKanban,
  GraduationCap, FolderOpen, Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { APP_SCREENS, type AppScreenKey } from '@/config/appScreens';

interface NavItem {
  path: string;
  search?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  title?: string;
}

const SCREEN_ICONS: Record<AppScreenKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  profile: User,
  jobs: Briefcase,
  applications: ClipboardList,
  review: FileText,
  assistant: MessageSquare,
  interview: Mic,
  coach: GraduationCap,
  warmup: Flame,
  negotiation: Handshake,
  skills: FlaskConical,
  aiAnalysis: LineChart,
  jobRadar: Radar,
  documents: FolderOpen,
  legal: Scale,
  settings: Settings,
  billing: CreditCard,
};

const fromScreen = (key: AppScreenKey, overrides?: Partial<NavItem>): NavItem => ({
  path: APP_SCREENS[key].path,
  label: APP_SCREENS[key].label,
  icon: SCREEN_ICONS[key],
  ...overrides,
});

const MAIN_FLOW: NavItem[] = [fromScreen('dashboard'), fromScreen('profile'), fromScreen('jobs'), fromScreen('applications'), fromScreen('review')];
const AI_GROWTH: NavItem[] = [fromScreen('assistant'), fromScreen('interview'), fromScreen('coach'), fromScreen('warmup'), fromScreen('negotiation'), fromScreen('skills'), fromScreen('aiAnalysis'), { path: '/case-practice', label: 'Case Practice', icon: FolderKanban }, fromScreen('jobRadar')];
const DOCUMENTS_ONLY: NavItem[] = [fromScreen('documents')];
const TOOLS: NavItem[] = [{ path: '/salary', label: 'Salary Calculator', icon: Calculator }, fromScreen('legal'), { path: '/reports', label: 'Reports', icon: BarChart2 }];
const AUTOMATION: NavItem[] = [{ path: '/auto-apply', label: 'Auto Apply', icon: Zap }];
const TECHNICAL: NavItem[] = [
  { path: '/settings', search: '?tab=privacy', label: 'Community Centre', icon: Users, title: 'Consent and data-sharing controls' },
  fromScreen('settings'),
  { path: '/security', label: 'Security, passkeys & 2FA', icon: Shield },
  fromScreen('billing'),
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
];

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return <div className="mb-4"><p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>{items.map((item) => <NavLink key={item.search ? `${item.path}${item.search}` : item.path} to={item.search ? { pathname: item.path, search: item.search.startsWith('?') ? item.search.slice(1) : item.search } : item.path} title={item.title} className={({ isActive }) => clsx('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100')}><item.icon className="h-4 w-4 shrink-0" /><span className="flex-1 truncate">{item.label}</span>{item.badge !== undefined && item.badge > 0 && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">{item.badge}</span>}</NavLink>)}</div>;
}

export default function Sidebar() {
  const { signOut } = useClerk();
  return <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-800"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"><Sparkles className="h-4 w-4 text-white" /></div><div><p className="text-sm font-bold text-slate-900 dark:text-white">MultivoHub</p><p className="text-[10px] text-slate-400 uppercase tracking-widest">Career Workspace</p></div></div><nav className="flex-1 overflow-y-auto p-3"><NavSection label="Main Flow" items={MAIN_FLOW} /><NavSection label="AI & Growth" items={AI_GROWTH} /><NavSection label="Documents" items={DOCUMENTS_ONLY} /><NavSection label="Tools & Insights" items={TOOLS} /><NavSection label="Automation" items={AUTOMATION} /><NavSection label="Technical & Account" items={TECHNICAL} /></nav><div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800"><button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><LogOut className="h-4 w-4" />Sign Out</button></div></aside>;
}
