import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { SyncPage } from './pages/SyncPage';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportManagementPage } from './pages/coordinator/ReportManagementPage';
import { MaintenanceOverviewPage } from './pages/coordinator/MaintenanceOverviewPage';
import { initializeDatabase } from './db';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Seed local database on first run
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NetworkProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/new" element={<CreateReportPage />} />
                <Route path="sync" element={<SyncPage />} />
                <Route path="activity" element={<ActivityHistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Coordinator Specific Routes */}
                <Route path="management" element={<ReportManagementPage />} />
                <Route path="maintenance" element={<MaintenanceOverviewPage />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NetworkProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
