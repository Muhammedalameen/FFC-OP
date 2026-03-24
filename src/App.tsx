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
import { useStore, initFirebaseSync, GLOBAL_COLLECTIONS } from './store';

// Protected Route Component (Now optional)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useStore((state) => state.currentUser);
  // If there are no users in the system, allow access to set up the first user
  const users = useStore((state) => state.users);
  
  if (!currentUser && users.length > 0) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { theme, checkDbConnection } = useStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkDbConnection();
      await initFirebaseSync(GLOBAL_COLLECTIONS);
      
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
      <AnimatePresence>
        {isInitialLoading && <LoadingScreen message="جاري التحقق من الاتصال بقاعدة البيانات..." />}
      </AnimatePresence>

      {!isInitialLoading && (
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
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
              <Route path="admin/*" element={<Admin />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}
