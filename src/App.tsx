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
  const { theme, checkDbConnection, isDbConnected, dbConnectionError } = useStore();
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

  if (!isInitialLoading && isDbConnected === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">النظام غير متصل</h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            {dbConnectionError || 'تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت أو المحاولة مرة أخرى لاحقاً.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            إعادة محاولة الاتصال
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isInitialLoading && <LoadingScreen message="جاري التحقق من الاتصال بقاعدة البيانات..." />}
      </AnimatePresence>

      {!isInitialLoading && isDbConnected !== false && (
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
