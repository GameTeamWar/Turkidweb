
// components/admin/AdminLayout.tsx
'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { GlobalNotificationProvider } from './GlobalNotificationProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <GlobalNotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="lg:pl-64">
          <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </GlobalNotificationProvider>
  );
}

// The following code block was outside any function/component and referenced undefined variables.
// To fix the error, remove this block or move it into a custom hook/component where all variables are properly defined.
// If you need notification logic, consider creating a custom hook like useAdminNotifications and use it inside AdminLayout.