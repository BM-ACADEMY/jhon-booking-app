import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

const ProtectedRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
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
    </Route>
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
