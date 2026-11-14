import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

// Authenticated field & coordinator pages
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { SyncPage } from './pages/SyncPage';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportManagementPage } from './pages/coordinator/ReportManagementPage';
import { MaintenanceOverviewPage } from './pages/coordinator/MaintenanceOverviewPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
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
    // Ensure offline database initialized
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NetworkProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Protected Application Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/new" element={<CreateReportPage />} />
                <Route path="sync" element={<SyncPage />} />
                <Route path="activity" element={<ActivityHistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Coordinator & Admin Routes */}
                <Route
                  path="management"
                  element={
                    <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                      <ReportManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="maintenance"
                  element={
                    <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                      <MaintenanceOverviewPage />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator & Coordinator Routes */}
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NetworkProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
}
