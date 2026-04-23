import { NavLink } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard, User, FolderOpen, Briefcase, ClipboardList, FileText, MessageSquare,
  Flame, Mic, GraduationCap, Handshake, FolderKanban, FlaskConical, BarChart2, Radar,
  Calculator, Scale, Users, Settings, CreditCard, HelpCircle, Sparkles, LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import { APP_SCREENS, SIDEBAR_SCREEN_ORDER, type AppScreenKey } from '@/config/appScreens';

const SCREEN_ICONS: Record<AppScreenKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  profile: User,
  documentHub: FolderOpen,
  documentUpload: FolderOpen,
  styleStudio: FolderOpen,
  jobs: Briefcase,
  applications: ClipboardList,
  applicationsReview: FileText,
  assistant: MessageSquare,
  dailyWarmup: Flame,
  interview: Mic,
  coach: GraduationCap,
  negotiation: Handshake,
  caseStudy: FolderKanban,
  skills: FlaskConical,
  reports: BarChart2,
  jobRadar: Radar,
  salaryCalculator: Calculator,
  legal: Scale,
  legalSearch: Scale,
  communityCenter: Users,
  settings: Settings,
  autoApply: Settings,
  billing: CreditCard,
  faq: HelpCircle,
};

export default function Sidebar() {
  const { signOut } = useClerk();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"><Sparkles className="h-4 w-4 text-white" /></div>
        <div><p className="text-sm font-bold text-slate-900 dark:text-white">MultivoHub</p><p className="text-[10px] uppercase tracking-widest text-slate-400">Career Workspace</p></div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {SIDEBAR_SCREEN_ORDER.map((key) => {
          const screen = APP_SCREENS[key];
          if (!screen.topLevel || !screen.showInSidebar) return null;
          const Icon = SCREEN_ICONS[key];
          const to = screen.path;

          return (
            <NavLink
              key={screen.path}
              to={to}
              className={({ isActive }) => clsx('mb-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{screen.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
        <button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><LogOut className="h-4 w-4" />Sign Out</button>
      </div>
    </aside>
  );
}
