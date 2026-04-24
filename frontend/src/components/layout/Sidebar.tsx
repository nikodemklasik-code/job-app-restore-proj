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
      <div className="flex h-[5.5rem] shrink-0 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[17px] font-black leading-tight text-slate-950 dark:text-white">MultivoHub</p>
          <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Career Workspace
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-5">
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
                'group relative mb-2 flex min-h-12 items-center gap-3.5 rounded-2xl px-4 py-3 text-[15.5px] font-bold leading-tight transition-all',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30 dark:bg-indigo-500 dark:text-white dark:ring-indigo-300/20'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
              )}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity',
                      isActive ? 'bg-white/90 opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon className={clsx('h-5 w-5 shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-100')} />
                  <span className="truncate">{screen.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={() => void signOut()}
          className="flex min-h-12 w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15.5px] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
