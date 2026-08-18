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
import ResetPasswordPage from './pages/ResetPasswordPage';
import PublicBookingDetails from './pages/PublicBookingDetails';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

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
import AboutPageManagement from './admin/pages/AboutPageManagement';
import ContactPageManagement from './admin/pages/ContactPageManagement';
import RoomPageManagement from './admin/pages/RoomPageManagement';
import DynamicSections from './admin/pages/DynamicSections';
import Settings from './admin/pages/Settings';
import AdminProfile from './admin/pages/AdminProfile';
import RoomsReview from './admin/pages/RoomsReview';
import AddonsManagement from './admin/pages/AddonsManagement';
import RoomVisitors from './admin/pages/RoomVisitors';
import AdminCreateBooking from './admin/pages/AdminCreateBooking';
import AddonsPage from './pages/AddonsPage';
import LegalManagement from './admin/pages/LegalManagement';

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
    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

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
      <Route path="/booking-details/:id" element={<PublicBookingDetails />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/terms-and-conditions" element={<TermsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPage />} />
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
      <Route path="about-page" element={<AboutPageManagement />} />
      <Route path="contact-page" element={<ContactPageManagement />} />
      <Route path="rooms-page" element={<RoomPageManagement />} />
      <Route path="rooms" element={<RoomManagement />} />
      <Route path="bookings" element={<BookingManagement />} />
      <Route path="create-booking" element={<AdminCreateBooking />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="reviews" element={<RoomsReview />} />
      <Route path="testimonials" element={<TestimonialsManagement />} />
      <Route path="addons" element={<AddonsManagement />} />
      <Route path="messages" element={<MessagesManagement />} />
      <Route path="sections" element={<DynamicSections />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="visitors" element={<RoomVisitors />} />
      <Route path="legal/:type" element={<LegalManagement />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import { AnimatePresence } from 'framer-motion';
import InitialLoader from './components/InitialLoader';

const App = () => {
  const [showLoader, setShowLoader] = useState(true);
  const [toastPosition, setToastPosition] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 640 ? 'top-right' : 'top-center'
  );

  useEffect(() => {
    const handler = () =>
      setToastPosition(window.innerWidth >= 640 ? 'top-right' : 'top-center');
    window.addEventListener('resize', handler);
    
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1800);

    return () => {
      window.removeEventListener('resize', handler);
      clearTimeout(timer);
    };
  }, []);

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {showLoader && <InitialLoader />}
      </AnimatePresence>
      <ScrollToTop />
      <AuthProvider>
        <Toaster
          position={toastPosition}
          reverseOrder={false}
          gutter={12}
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            duration: 4000,
          }}
        />
        <AuthModal />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
