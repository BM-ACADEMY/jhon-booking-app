import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/hero': 'Hero Section',
  '/admin/rooms': 'Rooms & Categories',
  '/admin/bookings': 'Booking Management',
  '/admin/users': 'User Management',
  '/admin/testimonials': 'Testimonials',
  '/admin/sections': 'Dynamic Sections',
  '/admin/settings': 'Settings',
  '/admin/profile': 'Admin Profile',
};

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = pageTitles[location.pathname] || 'Admin Profile';

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: Sidebar Trigger & Breadcrumb (shadcn sidebar-07 pattern) */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="shrink-0" />
        <div className="h-4 w-[1px] bg-gray-200 shrink-0" />
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          <Link to="/admin" className="text-gray-400 hover:text-gray-700 font-medium transition-colors truncate max-w-[110px] sm:max-w-none shrink-0">
            Admin Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span className="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{pageTitle}</span>
        </nav>
      </div>

      {/* Right: User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 p-1.5 pr-3 h-auto rounded-xl hover:bg-slate-100">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary-500/20 text-primary-600 font-bold text-sm">
                  {(user?.name?.[0] || 'A').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 truncate max-w-[120px]">
                {user?.name || 'Admin'}
              </span>
              <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-1.5">
            <DropdownMenuLabel className="normal-case">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-xs font-medium text-gray-400">{user?.email || 'admin@jhon.com'}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="gap-2.5 cursor-pointer">
              <User className="w-4 h-4 text-gray-500" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="gap-2.5 cursor-pointer">
              <Settings className="w-4 h-4 text-gray-500" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
