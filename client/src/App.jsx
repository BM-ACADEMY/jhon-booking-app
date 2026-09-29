import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import ScrollToTop from './components/ScrollToTop';
import AuthModal from './components/AuthModal';
import InitialLoader from './components/InitialLoader';

// Layouts (Keep layouts eager)
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './admin/layout/AdminLayout';

// Public Pages - Lazy Loaded
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PublicBookingDetails = lazy(() => import('./pages/PublicBookingDetails'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AddonsPage = lazy(() => import('./pages/AddonsPage'));

// Admin Pages - Lazy Loaded
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const RoomManagement = lazy(() => import('./admin/pages/RoomManagement'));
const BookingManagement = lazy(() => import('./admin/pages/BookingManagement'));
const UserManagement = lazy(() => import('./admin/pages/UserManagement'));
const TestimonialsManagement = lazy(() => import('./admin/pages/TestimonialsManagement'));
const MessagesManagement = lazy(() => import('./admin/pages/MessagesManagement'));
const HeroManagement = lazy(() => import('./admin/pages/HeroManagement'));
const AboutPageManagement = lazy(() => import('./admin/pages/AboutPageManagement'));
const ContactPageManagement = lazy(() => import('./admin/pages/ContactPageManagement'));
const RoomPageManagement = lazy(() => import('./admin/pages/RoomPageManagement'));
const DynamicSections = lazy(() => import('./admin/pages/DynamicSections'));
const Settings = lazy(() => import('./admin/pages/Settings'));
const AdminProfile = lazy(() => import('./admin/pages/AdminProfile'));
const RoomsReview = lazy(() => import('./admin/pages/RoomsReview'));
const AddonsManagement = lazy(() => import('./admin/pages/AddonsManagement'));
const RoomVisitors = lazy(() => import('./admin/pages/RoomVisitors'));
const AdminCreateBooking = lazy(() => import('./admin/pages/AdminCreateBooking'));
const LegalManagement = lazy(() => import('./admin/pages/LegalManagement'));

const ProtectedRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<InitialLoader />}>
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
  </Suspense>
);

const CanonicalTag = () => {
  const location = useLocation();
  const canonicalUrl = `https://thebalifiedvilla.com${location.pathname}`;
  
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

const App = () => {
  const [toastPosition, setToastPosition] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 640 ? 'top-right' : 'top-center'
  );

  useEffect(() => {
    const handler = () =>
      setToastPosition(window.innerWidth >= 640 ? 'top-right' : 'top-center');
    window.addEventListener('resize', handler);

    return () => {
      window.removeEventListener('resize', handler);
    };
  }, []);

  return (
    <BrowserRouter>
      <CanonicalTag />
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
