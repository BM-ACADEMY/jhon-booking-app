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
import MessagesManagement from './admin/pages/MessagesManagement';
import HeroManagement from './admin/pages/HeroManagement';
import DynamicSections from './admin/pages/DynamicSections';
import Settings from './admin/pages/Settings';
import AdminProfile from './admin/pages/AdminProfile';
import RoomsReview from './admin/pages/RoomsReview';
import AddonsManagement from './admin/pages/AddonsManagement';
import AddonsPage from './pages/AddonsPage';

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
      <Route path="/checkout/addons" element={<AddonsPage />} />
      <Route path="/mybookings" element={<MyBookings />} />
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
      <Route path="reviews" element={<RoomsReview />} />
      <Route path="testimonials" element={<TestimonialsManagement />} />
      <Route path="addons" element={<AddonsManagement />} />
      <Route path="messages" element={<MessagesManagement />} />
      <Route path="sections" element={<DynamicSections />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<AdminProfile />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import { useState, useEffect } from 'react';

const App = () => {
  const [toastPosition, setToastPosition] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 640 ? 'top-right' : 'top-center'
  );

  useEffect(() => {
    const handler = () =>
      setToastPosition(window.innerWidth >= 640 ? 'top-right' : 'top-center');
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Toaster
          position={toastPosition}
          reverseOrder={false}
          gutter={12}
          toastOptions={{
            duration: 4000,
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
