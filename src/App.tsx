import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Revenue from './pages/Revenue';
import Inventory from './pages/Inventory';
import NeedReport from './pages/NeedReport';
import WasteReport from './pages/WasteReport';
import Inspection from './pages/Inspection';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';
import Admin from './pages/Admin';
import Reports from './pages/Reports';
import ScheduledReadings from './pages/ScheduledReadings';
import RevenueReports from './pages/RevenueReports';
import CarHandovers from './pages/CarHandovers';
import NewCarHandover from './pages/NewCarHandover';
import ReturnCarHandover from './pages/ReturnCarHandover';
import LoadingScreen from './components/LoadingScreen';
import SyncProgressBar from './components/SyncProgressBar';
import { useStore, initTursoSync, GLOBAL_COLLECTIONS } from './store';

// Protected Route Component
const ProtectedRoute = ({ children, allowNoUsers = false }: { children: React.ReactNode, allowNoUsers?: boolean }) => {
  const currentUser = useStore((state) => state.currentUser);
  const users = useStore((state) => state.users);
  
  // If not logged in
  if (!currentUser) {
    // If we allow access when no users exist (for setup)
    if (allowNoUsers && users.length === 0) {
      return <>{children}</>;
    }
    // Otherwise redirect to login
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  const { theme, checkDbConnection, isLoading, syncProgress } = useStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkDbConnection();
      await initTursoSync(GLOBAL_COLLECTIONS);
      
      // Add a small delay to show the nice animation
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 1500);
    };
    init();
  }, [checkDbConnection]);

  useEffect(() => {
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <>
      <SyncProgressBar />
      <AnimatePresence>
        {isInitialLoading && <LoadingScreen message="جاري التحقق من الاتصال بقاعدة البيانات..." />}
        {!isInitialLoading && isLoading && !syncProgress && <LoadingScreen message="جاري مزامنة البيانات..." />}
      </AnimatePresence>

      {!isInitialLoading && (
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Main App Routes - Strictly Protected */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="revenue-reports" element={<RevenueReports />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="need-report" element={<NeedReport />} />
              <Route path="waste-report" element={<WasteReport />} />
              <Route path="inspection" element={<Inspection />} />
              <Route path="scheduled-readings" element={<ScheduledReadings />} />
              <Route path="reports" element={<Reports />} />
              <Route path="maintenance" element={<Tickets type="maintenance" />} />
              <Route path="purchase" element={<Tickets type="purchase" />} />
              <Route path="ticket/:id" element={<TicketDetails />} />
              <Route path="car-handovers" element={<CarHandovers />} />
              <Route path="car-handovers/new" element={<NewCarHandover />} />
              <Route path="car-handovers/return/:id" element={<ReturnCarHandover />} />
            </Route>

            {/* Admin Routes - Allowed if no users exist (for setup) */}
            <Route path="/admin/*" element={<ProtectedRoute allowNoUsers={true}><Layout /></ProtectedRoute>}>
              <Route index element={<Admin />} />
              <Route path="*" element={<Admin />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}
