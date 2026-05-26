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

const links = [
  { to: '/',            label: 'Home',        Icon: HomeIcon },
  { to: '/regions',     label: 'Regions',     Icon: MapIcon },
  { to: '/bird-guide',  label: 'Bird Guide',  Icon: BookOpenIcon },
  { to: '/add-sighting',label: 'Log Bird',    Icon: PlusCircleIcon },
  { to: '/sightings',   label: 'Sightings',   Icon: ClipboardDocumentListIcon },
  { to: '/life-list',   label: 'Life List',   Icon: StarIcon },
  { to: '/settings',    label: 'Settings',    Icon: Cog6ToothIcon },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-forest-900 border-t border-forest-700 safe-bottom">
      <div className="flex items-stretch justify-around h-16 max-w-2xl mx-auto">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors ${
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
