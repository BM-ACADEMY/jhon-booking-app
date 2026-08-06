import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PublicLayout = () => {
  const location = useLocation();
  const hideNavFooter = location.pathname === '/checkout/addons';
  const hideFooter = location.pathname.startsWith('/rooms/') || hideNavFooter;

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavFooter && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;
