import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-background flex">
      {/* Desktop Fixed Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Mobile Top Header */}
      <Header />

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 pt-20 md:pt-margin-desktop px-margin-mobile md:px-margin-desktop pb-32 md:pb-xl w-full max-w-[1400px] mx-auto flex flex-col gap-xl transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
          }`}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}