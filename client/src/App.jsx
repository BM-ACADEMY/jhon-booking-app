import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import MyBookings from './pages/MyBookings';
import WishlistPage from './pages/WishlistPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';

// Admin
import AdminLayout from './admin/layout/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import RoomManagement from './admin/pages/RoomManagement';
import BookingManagement from './admin/pages/BookingManagement';
import UserManagement from './admin/pages/UserManagement';
import TestimonialsManagement from './admin/pages/TestimonialsManagement';
import HeroManagement from './admin/pages/HeroManagement';
import DynamicSections from './admin/pages/DynamicSections';
import Settings from './admin/pages/Settings';
import AdminProfile from './admin/pages/AdminProfile';

const ProtectedRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public website */}
    {/* Standalone auth pages (no Navbar/Footer) */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />

    {/* Public website with Navbar + Footer */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
      <Route path="/bookings/my" element={<MyBookings />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
    </Route>

    {/* Admin */}
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="hero" element={<HeroManagement />} />
      <Route path="rooms" element={<RoomManagement />} />
      <Route path="bookings" element={<BookingManagement />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="testimonials" element={<TestimonialsManagement />} />
      <Route path="sections" element={<DynamicSections />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<AdminProfile />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

import { Toaster } from 'react-hot-toast';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            padding: '14px 18px',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.01em',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(16px)',
            maxWidth: '360px',
            lineHeight: '1.5',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderLeft: '3px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderLeft: '3px solid #ef4444',
            },
          },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
