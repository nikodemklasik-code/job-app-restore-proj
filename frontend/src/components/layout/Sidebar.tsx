import { NavLink } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard, Briefcase, ClipboardList, FileText,
<<<<<<< HEAD
  MessageSquare, Mic, CreditCard, Settings,
  Shield, Palette, LogOut, Sparkles, Calculator, Scale, BarChart2, Zap,
  FlaskConical, Handshake, Radar, HelpCircle, FolderOpen, GraduationCap, Flame,
=======
  MessageSquare, Mic, User, CreditCard, Settings,
  Shield, Palette, LogOut, Sparkles, Calculator, Scale, BarChart2, Zap, FlaskConical, Handshake, Radar, Flame, HelpCircle,
>>>>>>> live-hardening
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

<<<<<<< HEAD
const PROFILE: NavItem[] = [
  { path: '/dashboard', label: 'Profile & Goals', icon: LayoutDashboard },
];

const JOB_SEARCH: NavItem[] = [
  { path: '/jobs', label: 'Job Listings', icon: Briefcase },
  { path: '/applications', label: 'Applications', icon: ClipboardList },
  { path: '/review', label: 'Applications Review', icon: FileText },
];

const SKILLS: NavItem[] = [
  { path: '/skills', label: 'Skills Lab', icon: FlaskConical },
];

const AI_TOOLS: NavItem[] = [
  { path: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { path: '/radar', label: 'Job Radar', icon: Radar },
];

const COACHING: NavItem[] = [
  { path: '/interview', label: 'Interview', icon: Mic },
  { path: '/warmup', label: 'Daily Warmup', icon: Flame },
  { path: '/coach', label: 'Coach', icon: GraduationCap },
  { path: '/negotiation', label: 'Negotiation', icon: Handshake },
];

const DOCUMENTS: NavItem[] = [
  { path: '/documents', label: 'Document Lab', icon: FolderOpen },
=======
const MAIN_FLOW: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/applications', label: 'Applications', icon: ClipboardList },
  { path: '/review', label: 'Review Queue', icon: FileText },
];

const AI_GROWTH: NavItem[] = [
  { path: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { path: '/interview', label: 'Interview Ready', icon: Mic },
  { path: '/warmup', label: 'Daily Warmup', icon: Flame },
  { path: '/negotiation', label: 'Negotiation Coach', icon: Handshake },
  { path: '/skills', label: 'Skills Lab', icon: FlaskConical },
  { path: '/radar', label: 'Job Radar', icon: Radar },
];

const PROFILE_DOCS: NavItem[] = [
  { path: '/profile', label: 'CV Studio', icon: User },
>>>>>>> live-hardening
  { path: '/style-studio', label: 'Style Studio', icon: Palette },
];

const TOOLS: NavItem[] = [
  { path: '/salary', label: 'Salary Calculator', icon: Calculator },
  { path: '/legal', label: 'Legal Hub', icon: Scale },
  { path: '/reports', label: 'Reports', icon: BarChart2 },
<<<<<<< HEAD
  { path: '/auto-apply', label: 'Auto Apply', icon: Zap },
];

const ACCOUNT: NavItem[] = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/security', label: 'Security', icon: Shield },
=======
];

const AUTOMATION: NavItem[] = [
  { path: '/auto-apply', label: 'Auto Apply', icon: Zap },
];

const TECHNICAL: NavItem[] = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/security', label: 'Security', icon: Shield },
  { path: '/billing', label: 'Billing', icon: CreditCard },
>>>>>>> live-hardening
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
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
        key={item.path}
        to={item.path}
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
<<<<<<< HEAD
        <NavSection label="Profile" items={PROFILE} />
        <NavSection label="Job Search" items={JOB_SEARCH} />
        <NavSection label="Skills" items={SKILLS} />
        <NavSection label="AI Tools" items={AI_TOOLS} />
        <NavSection label="Interviews & Coaching" items={COACHING} />
        <NavSection label="Documents" items={DOCUMENTS} />
        <NavSection label="Tools" items={TOOLS} />
        <NavSection label="Account" items={ACCOUNT} />
=======
        <NavSection label="Main Flow" items={MAIN_FLOW} />
        <NavSection label="AI & Growth" items={AI_GROWTH} />
        <NavSection label="Profile & Documents" items={PROFILE_DOCS} />
        <NavSection label="Tools & Insights" items={TOOLS} />
        <NavSection label="Automation" items={AUTOMATION} />
        <NavSection label="Technical & Account" items={TECHNICAL} />
>>>>>>> live-hardening
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
