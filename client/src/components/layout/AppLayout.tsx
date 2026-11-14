import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { OfflineBanner } from '../ui/OfflineBanner';
import { ServerWakingBanner } from '../ui/ServerWakingBanner';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100 transition-colors">
      {/* Skip to Main Content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#163A5F] focus:text-white focus:rounded-lg focus:shadow-xl focus:font-semibold text-xs focus:ring-2 focus:ring-blue-400"
      >
        Skip to main content
      </a>

      {/* Connectivity & Gateway Status Banners */}
      <OfflineBanner />
      <ServerWakingBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Primary Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopBar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 focus:outline-none"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
