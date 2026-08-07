import { NavLink } from 'react-router-dom';
import {
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  BookOpenIcon as BookOpenSolid,
  ChartBarIcon as ChartBarSolid,
  Cog6ToothIcon as CogSolid,
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
} from '@heroicons/react/24/solid';

const items = [
  { to: '/', label: 'Главная', icon: HomeIcon, activeIcon: HomeSolid, end: true },
  {
    to: '/library',
    label: 'Библиотека',
    icon: BookOpenIcon,
    activeIcon: BookOpenSolid,
  },
  {
    to: '/search',
    label: 'Поиск',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassSolid,
  },
  {
    to: '/stats',
    label: 'Статистика',
    icon: ChartBarIcon,
    activeIcon: ChartBarSolid,
  },
  {
    to: '/settings',
    label: 'Ещё',
    icon: Cog6ToothIcon,
    activeIcon: CogSolid,
  },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-1 py-1">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-medium transition sm:text-xs ${
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => {
                const Icon = isActive ? item.activeIcon : item.icon;
                return (
                  <>
                    <Icon className="h-6 w-6" />
                    <span>{item.label}</span>
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
