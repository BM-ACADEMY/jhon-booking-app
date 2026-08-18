import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, ChevronRight, Bell, CalendarCheck } from 'lucide-react';
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
import api from '../../api';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

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

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuTimeoutRef = useRef(null);

  const handleUserMenuEnter = () => {
    if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
    setUserMenuOpen(true);
  };

  const handleUserMenuLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 150);
  };

  const pageTitle = pageTitles[location.pathname] || 'Admin Profile';

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    navigate('/admin/bookings');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
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

      {/* Right: Notifications & User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100">
              <Bell className="w-5 h-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-1.5">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="normal-case p-0 text-sm font-bold text-gray-800">
                Notifications
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className="gap-2.5 cursor-pointer items-start py-2.5"
                  >
                    <CalendarCheck className={`w-4 h-4 mt-0.5 shrink-0 ${n.read ? 'text-gray-400' : 'text-primary-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs truncate ${n.read ? 'text-gray-500 font-medium' : 'text-gray-900 font-bold'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <div onMouseEnter={handleUserMenuEnter} onMouseLeave={handleUserMenuLeave}>
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
          </div>
          <DropdownMenuContent 
            align="end" 
            className="w-52 p-1.5"
            onMouseEnter={handleUserMenuEnter}
            onMouseLeave={handleUserMenuLeave}
          >
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
