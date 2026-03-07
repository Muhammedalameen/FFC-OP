import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Revenue from './pages/Revenue';
import Inventory from './pages/Inventory';
import NeedReport from './pages/NeedReport';
import Inspection from './pages/Inspection';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';
import Admin from './pages/Admin';
import Reports from './pages/Reports';
import ScheduledReadings from './pages/ScheduledReadings';
import { useStore } from './store';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useStore((state) => state.currentUser);
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { theme } = useStore();

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
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="need-report" element={<NeedReport />} />
          <Route path="inspection" element={<Inspection />} />
          <Route path="scheduled-readings" element={<ScheduledReadings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="maintenance" element={<Tickets type="maintenance" />} />
          <Route path="purchase" element={<Tickets type="purchase" />} />
          <Route path="ticket/:id" element={<TicketDetails />} />
          <Route path="admin/*" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}
