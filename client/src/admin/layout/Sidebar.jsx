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
  CalendarPlus,
  Users,
  Star,
  Quote,
  Film,
  Sparkles,
  Settings,
  User,
  Mail,
  Eye,
  ChevronsUpDown,
  LogOut,
  ChevronDown,
  FileText,
  Info,
  PhoneCall,
  Inbox,
  ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    ]
  },
  {
    title: 'BOOKING & GUESTS',
    items: [
      { label: 'Bookings', icon: CalendarCheck, path: '/admin/bookings' },
      { label: 'Create Booking', icon: CalendarPlus, path: '/admin/create-booking' },
      { label: 'Room Visitors', icon: Eye, path: '/admin/visitors' },
      { label: 'Users', icon: Users, path: '/admin/users' },
    ]
  },
  {
    title: 'PROPERTY & SERVICES',
    items: [
      { label: 'Rooms & Categories', icon: BedDouble, path: '/admin/rooms' },
      { label: 'Add-on Services', icon: Sparkles, path: '/admin/addons' },
    ]
  },
  {
    title: 'COMMUNICATION & REVIEWS',
    items: [
      { label: 'Contact Form', icon: Mail, path: '/admin/messages', badge: true },
      { label: 'Rooms Review', icon: Star, path: '/admin/reviews' },
      { label: 'Testimonials', icon: Quote, path: '/admin/testimonials' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings, path: '/admin/settings' },
      { label: 'Profile', icon: User, path: '/admin/profile' },
    ]
  }
];

const pagesEditItems = [
  { label: 'Hero Section', icon: Film, path: '/admin/hero' },
  { label: 'About Page', icon: Info, path: '/admin/about-page' },
  { label: 'Contact Page', icon: PhoneCall, path: '/admin/contact-page' },
];

const legalItems = [
  { label: 'Terms & Conditions', icon: FileText, path: '/admin/legal/terms' },
  { label: 'Privacy Policy', icon: ShieldCheck, path: '/admin/legal/privacy' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [pagesEditOpen, setPagesEditOpen] = useState(true);
  const [legalOpen, setLegalOpen] = useState(true);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    // Instant clear when visiting Bookings page
    if (location.pathname.startsWith('/admin/bookings')) {
      api.patch('/bookings/mark-viewed').catch(err => console.error(err));
      setNewBookingsCount(0);
    }

    // Instant clear when visiting Contact Form (Messages) page
    if (location.pathname.startsWith('/admin/messages')) {
      api.patch('/messages/mark-all-read').catch(err => console.error(err));
      setUnreadCount(0);
    }

    const fetchCounts = async () => {
      try {
        const [msgRes, bookingRes] = await Promise.all([
          api.get('/messages'),
          api.get('/bookings/new-count')
        ]);
        
        if (!location.pathname.startsWith('/admin/messages')) {
          const count = msgRes.data.filter(m => !m.read).length;
          setUnreadCount(count);
        }
        
        if (!location.pathname.startsWith('/admin/bookings')) {
          if (bookingRes.data && bookingRes.data.count !== undefined) {
            setNewBookingsCount(bookingRes.data.count);
          }
        }
      } catch (err) {
        console.error('Failed to fetch unread notifications count', err);
      }
    };

    fetchCounts();

    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-white/10 bg-sidebar text-sidebar-foreground">
      {/* Header - Brand */}
      <SidebarHeader className="border-b border-white/10 p-2 flex items-center justify-center">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent justify-center p-0">
              <Link to="/" onClick={handleLinkClick} className="flex items-center justify-center gap-3 w-full">
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

      {/* Main Navigation */}
      <SidebarContent className="px-2 py-3 space-y-4">
        
        {/* Render Formatted Sections */}
        {navSections.map((section) => (
          <SidebarGroup key={section.title} className="p-0">
            {state !== 'collapsed' && (
              <SidebarGroupLabel className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-1">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {section.items.map(({ label, icon: Icon, path, badge }) => {
                const isActive =
                  path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(path);

                const isBookingsItem = label === 'Bookings';
                const showBookingsBadge = isBookingsItem && newBookingsCount > 0;
                const showMessagesBadge = badge && unreadCount > 0;

                return (
                  <SidebarMenuItem key={path} className="flex justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className={state === 'collapsed' ? 'justify-center p-2' : ''}
                    >
                      <NavLink to={path} onClick={handleLinkClick} className={`flex items-center gap-3 w-full ${state === 'collapsed' ? 'justify-center' : ''}`}>
                        <div className="relative flex items-center justify-center">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-400 font-bold' : 'text-gray-400'}`} />
                          {(showBookingsBadge || showMessagesBadge) && state === 'collapsed' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-sidebar animate-pulse" />
                          )}
                        </div>
                        {state !== 'collapsed' && <span className="flex-1 font-medium text-xs sm:text-sm truncate">{label}</span>}
                        
                        {/* Red Bookings Indicator Badge with Count */}
                        {showBookingsBadge && state !== 'collapsed' && (
                          <Badge variant="default" className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 ml-auto gap-1 rounded-full shadow-sm animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            {newBookingsCount} NEW
                          </Badge>
                        )}

                        {/* Red Contact Form Badge with Count */}
                        {showMessagesBadge && state !== 'collapsed' && (
                          <Badge variant="default" className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 ml-auto gap-1 rounded-full shadow-sm animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            {unreadCount} NEW
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        {/* PAGES EDIT COLLAPSIBLE SECTION */}
        <SidebarGroup className="p-0">
          {state !== 'collapsed' && (
            <SidebarGroupLabel className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-1">
              WEBSITE CONTENT
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-col justify-center">
              <SidebarMenuButton
                onClick={() => setPagesEditOpen(!pagesEditOpen)}
                tooltip="Pages Edit"
                className={`flex items-center justify-between w-full text-white/90 hover:bg-white/10 ${state === 'collapsed' ? 'justify-center p-2' : ''}`}
              >
                <div className={`flex items-center gap-3 ${state === 'collapsed' ? 'justify-center' : ''}`}>
                  <FileText className="w-4 h-4 shrink-0 text-primary-400" />
                  {state !== 'collapsed' && <span className="font-medium text-xs sm:text-sm">Pages Edit</span>}
                </div>
                {state !== 'collapsed' && (
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${pagesEditOpen ? 'rotate-180' : ''}`} />
                )}
              </SidebarMenuButton>

              {/* Dropdown Sub-Items */}
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
                        <NavLink to={path} onClick={handleLinkClick} className={`flex items-center gap-3 w-full ${state === 'collapsed' ? 'justify-center' : ''}`}>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-400'}`} />
                          {state !== 'collapsed' && <span className="flex-1 font-medium text-xs truncate">{label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    );
                  })}
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* LEGAL & POLICIES COLLAPSIBLE SECTION */}
        <SidebarGroup className="p-0">
          {state !== 'collapsed' && (
            <SidebarGroupLabel className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-1">
              LEGAL MANAGEMENT
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-col justify-center">
              <SidebarMenuButton
                onClick={() => setLegalOpen(!legalOpen)}
                tooltip="Legal & Policies"
                className={`flex items-center justify-between w-full text-white/90 hover:bg-white/10 ${state === 'collapsed' ? 'justify-center p-2' : ''}`}
              >
                <div className={`flex items-center gap-3 ${state === 'collapsed' ? 'justify-center' : ''}`}>
                  <ShieldCheck className="w-4 h-4 shrink-0 text-primary-400" />
                  {state !== 'collapsed' && <span className="font-medium text-xs sm:text-sm">Legal & Policies</span>}
                </div>
                {state !== 'collapsed' && (
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${legalOpen ? 'rotate-180' : ''}`} />
                )}
              </SidebarMenuButton>

              {/* Dropdown Sub-Items */}
              {(legalOpen || state === 'collapsed') && (
                <div className={`space-y-1 mt-1 ${state !== 'collapsed' ? 'pl-4 border-l border-white/10 ml-4' : ''}`}>
                  {legalItems.map(({ label, icon: Icon, path }) => {
                    const isActive = location.pathname.startsWith(path);
                    return (
                      <SidebarMenuButton
                        key={path}
                        asChild
                        isActive={isActive}
                        tooltip={label}
                        className={state === 'collapsed' ? 'justify-center p-2' : ''}
                      >
                        <NavLink to={path} onClick={handleLinkClick} className={`flex items-center gap-3 w-full ${state === 'collapsed' ? 'justify-center' : ''}`}>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-400'}`} />
                          {state !== 'collapsed' && <span className="flex-1 font-medium text-xs truncate">{label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    );
                  })}
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      {/* Footer User Profile */}
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
                  <Link to="/admin/profile" onClick={handleLinkClick} className="flex items-center gap-2.5 cursor-pointer">
                    <User className="w-4 h-4 text-gray-500" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" onClick={handleLinkClick} className="flex items-center gap-2.5 cursor-pointer">
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
