import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  Star,
  Film,
  Layers,
  Settings,
  X,
  Hotel,
  ChevronRight,
  User,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Hero Section', icon: Film, path: '/admin/hero' },
  { label: 'Rooms & Categories', icon: BedDouble, path: '/admin/rooms' },
  { label: 'Bookings', icon: CalendarCheck, path: '/admin/bookings' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Testimonials', icon: Star, path: '/admin/testimonials' },
  // { label: 'Dynamic Sections', icon: Layers, path: '/admin/sections' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Profile', icon: User, path: '/admin/profile' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-sidebar z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Jhon Booking</p>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
            Main Menu
          </p>
          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, path }) => {
              const isActive =
                path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(path);

              return (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-150 group relative
                      ${
                        isActive
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-400 rounded-r-full" />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-white'}`} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Administrator</p>
              <p className="text-gray-500 text-xs truncate">admin@jhon.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
