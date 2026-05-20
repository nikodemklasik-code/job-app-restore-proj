import { NavLink } from 'react-router-dom';
import { Briefcase, BookmarkCheck, Radar, ClipboardList } from 'lucide-react';

const tabs = [
  { to: '/jobs', label: 'Search', icon: Briefcase, end: true },
  { to: '/jobs/saved', label: 'Saved', icon: BookmarkCheck, end: false },
  { to: '/job-radar', label: 'Radar', icon: Radar, end: false },
  { to: '/applications', label: 'Applications', icon: ClipboardList, end: false },
];

export function JobsLifecycleTabs() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Jobs lifecycle">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-white text-slate-950 shadow-sm'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
