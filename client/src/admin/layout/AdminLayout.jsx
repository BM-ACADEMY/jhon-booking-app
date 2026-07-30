import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

const AdminLayout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar />
      <SidebarInset className="flex flex-col min-w-0 bg-slate-50">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
