import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/LogoBalified.png';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  Star,
  Film,
  Layers,
  Settings,
  User,
  MessageSquare,
  Eye,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ChevronDown, FileText } from 'lucide-react';

const mainNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Rooms & Categories', icon: BedDouble, path: '/admin/rooms' },
  { label: 'Bookings', icon: CalendarCheck, path: '/admin/bookings' },
  { label: 'Room Visitors', icon: Eye, path: '/admin/visitors' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Rooms Review', icon: Star, path: '/admin/reviews' },
  { label: 'Testimonials', icon: Star, path: '/admin/testimonials' },
  { label: 'Add-on Services', icon: Layers, path: '/admin/addons' },
  { label: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Profile', icon: User, path: '/admin/profile' },
];

const pagesEditItems = [
  { label: 'Hero Section', icon: Film, path: '/admin/hero' },
  { label: 'About Page', icon: FileText, path: '/admin/about-page' },
  { label: 'Contact Page', icon: FileText, path: '/admin/contact-page' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagesEditOpen, setPagesEditOpen] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/messages');
        const count = res.data.filter(m => !m.read).length;
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread messages count', err);
      }
    };
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-white/10 bg-sidebar text-sidebar-foreground">
      {/* Header - Brand (sidebar-07) */}
      <SidebarHeader className="border-b border-white/10 p-2 flex items-center justify-center">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent justify-center p-0">
              <Link to="/" className="flex items-center justify-center gap-3 w-full">
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <img src={logoImg} className="w-full h-full object-cover" alt="The Balified Villa" />
                </div>
                {state !== 'collapsed' && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-white">The Balified Villa</span>
                    <span className="truncate text-xs text-gray-400">Admin Dashboard</span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation (sidebar-07) */}
      <SidebarContent className="px-2 py-3 space-y-2">
        
        {/* PAGES EDIT COLLAPSIBLE SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 font-bold text-xs uppercase tracking-wider px-2 mb-1">
            PAGES EDIT
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-col justify-center">
              <SidebarMenuButton
                onClick={() => setPagesEditOpen(!pagesEditOpen)}
                tooltip="Pages Edit"
                className={`flex items-center justify-between w-full text-white/90 hover:bg-white/10 ${state === 'collapsed' ? 'justify-center p-2' : ''}`}
              >
                <div className={`flex items-center gap-3 ${state === 'collapsed' ? 'justify-center' : ''}`}>
                  <FileText className="w-5 h-5 shrink-0 text-primary-400" />
                  {state !== 'collapsed' && <span className="font-semibold text-sm">Pages Edit</span>}
                </div>
                {state !== 'collapsed' && (
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${pagesEditOpen ? 'rotate-180' : ''}`} />
                )}
              </SidebarMenuButton>

              {/* Dropdown Items */}
              {(pagesEditOpen || state === 'collapsed') && (
                <div className={`space-y-1 mt-1 ${state !== 'collapsed' ? 'pl-4 border-l border-white/10 ml-4' : ''}`}>
                  {pagesEditItems.map(({ label, icon: Icon, path }) => {
                    const isActive = location.pathname.startsWith(path);
                    return (
                      <SidebarMenuButton
                        key={path}
                        asChild
                        isActive={isActive}
                        tooltip={label}
                        className={state === 'collapsed' ? 'justify-center p-2' : ''}
                      >
                        <NavLink to={path} className={`flex items-center gap-3 w-full ${state === 'collapsed' ? 'justify-center' : ''}`}>
                          <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-400'}`} />
                          {state !== 'collapsed' && <span className="flex-1 font-semibold text-xs truncate">{label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    );
                  })}
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* MAIN MENU SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 font-bold text-xs uppercase tracking-wider px-2 mb-1">
            MAIN MENU
          </SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map(({ label, icon: Icon, path }) => {
              const isActive =
                path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(path);

              return (
                <SidebarMenuItem key={path} className="flex justify-center">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={label}
                    className={state === 'collapsed' ? 'justify-center p-2' : ''}
                  >
                    <NavLink to={path} className={`flex items-center gap-3 w-full ${state === 'collapsed' ? 'justify-center' : ''}`}>
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-400'}`} />
                      {state !== 'collapsed' && <span className="flex-1 font-semibold truncate">{label}</span>}
                      {label === 'Messages' && unreadCount > 0 && state !== 'collapsed' && (
                        <Badge variant="default" className="bg-primary-500 text-white font-bold text-[10px] px-2 py-0.5 ml-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer User Profile (sidebar-07 pattern) */}
      <SidebarFooter className="border-t border-white/10 p-2 flex items-center justify-center">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={`data-[state=open]:bg-sidebar-hover data-[state=open]:text-white hover:bg-sidebar-hover ${state === 'collapsed' ? 'justify-center p-0' : ''}`}
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarFallback className="bg-primary-500/30 text-primary-400 font-bold text-xs">
                      {(user?.name?.[0] || 'A').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {state !== 'collapsed' && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-white">{user?.name || 'Administrator'}</span>
                        <span className="truncate text-xs text-gray-400">{user?.email || 'admin@jhon.com'}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl p-1.5"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-2 font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none text-gray-900">{user?.name || 'Administrator'}</p>
                    <p className="text-xs leading-none text-gray-400">{user?.email || 'admin@jhon.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="flex items-center gap-2.5 cursor-pointer">
                    <User className="w-4 h-4 text-gray-500" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="flex items-center gap-2.5 cursor-pointer">
                    <Settings className="w-4 h-4 text-gray-500" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2.5 text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
};

export default Sidebar;
