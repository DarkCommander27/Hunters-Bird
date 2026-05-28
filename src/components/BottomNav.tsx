import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  MapIcon,
  BookOpenIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import type { AppTheme } from '../types';

const links = [
  { to: '/',            label: 'Home',        Icon: HomeIcon },
  { to: '/regions',     label: 'Regions',     Icon: MapIcon },
  { to: '/bird-guide',  label: 'Bird Guide',  Icon: BookOpenIcon },
  { to: '/add-sighting',label: 'Log Bird',    Icon: PlusCircleIcon },
  { to: '/sightings',   label: 'Sightings',   Icon: ClipboardDocumentListIcon },
  { to: '/life-list',   label: 'Life List',   Icon: StarIcon },
  { to: '/settings',    label: 'Settings',    Icon: Cog6ToothIcon },
];

export function BottomNav({ theme = 'forest' }: { theme?: AppTheme }) {
  const isPokedex = theme === 'pokedex';

  return (
    <nav className={`fixed bottom-0 inset-x-0 z-50 safe-bottom ${
      isPokedex
        ? 'pokedex-nav border-t-4 border-slate-950/80 shadow-[0_-16px_40px_rgba(0,0,0,0.35)]'
        : 'bg-forest-900 border-t border-forest-700'
    }`}>
      <div className={`mx-auto flex items-stretch justify-around ${isPokedex ? 'h-[4.5rem] max-w-4xl gap-1 px-2' : 'h-16 max-w-2xl'}`}>
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isPokedex
                ? `mx-0.5 my-2 flex flex-col items-center justify-center rounded-2xl border px-1 text-[10px] font-semibold transition-all ${
                    isActive
                      ? 'border-forest-500 bg-forest-800 text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      : 'border-transparent text-forest-400 hover:border-forest-800 hover:text-forest-100'
                  }`
                : `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-forest-300'
                      : 'text-forest-500 hover:text-forest-300'
                  }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
