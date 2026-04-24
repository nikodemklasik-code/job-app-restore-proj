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
  skillLab: FlaskConical,
  reports: BarChart2,
  jobRadar: Radar,
  salaryCalculator: Calculator,
  legalHub: Scale,
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
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-base font-bold leading-tight text-slate-900 dark:text-white">MultivoHub</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Career Workspace
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {SIDEBAR_SCREEN_ORDER.map((key) => {
          const screen = APP_SCREENS[key];
          if (!screen.showInSidebar) return null;
          const Icon = SCREEN_ICONS[key];
          const to = screen.path;

          return (
            <NavLink
              key={screen.path}
              to={to}
              className={({ isActive }) => clsx(
                'mb-2 flex min-h-11 items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[15px] font-semibold leading-tight transition-colors',
                isActive
                  ? 'bg-indigo-100 text-indigo-800 shadow-sm ring-1 ring-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-200 dark:ring-indigo-800/70'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{screen.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={() => void signOut()}
          className="flex min-h-11 w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
