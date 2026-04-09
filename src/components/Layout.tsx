import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import NotificationManager from './NotificationManager';
import { 
  LayoutDashboard, DollarSign, Package, ClipboardCheck, Wrench, 
  ShoppingCart, Settings, LogOut, Moon, Sun, Monitor, BarChart3, 
  Clock, KeyRound, Bell, ChevronRight, ChevronLeft, CheckCircle2, 
  AlertCircle, Info, Download, Car, Trash2, X 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { currentUser, customRoles, logout, theme, setTheme, changeUserPin, notifications, removeNotification } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Installation Logic
  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const userRole = currentUser ? customRoles.find(r => r.id === currentUser.roleId) : null;
  const permissions = userRole?.permissions || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard, show: permissions.includes('view_all_branches') },
    { name: 'الإيرادات اليومية', path: '/revenue', icon: DollarSign, show: permissions.includes('view_revenue') },
    { name: 'جرد المخزون', path: '/inventory', icon: Package, show: permissions.includes('view_inventory') },
    { name: 'القراءات المجدولة', path: '/scheduled-readings', icon: Clock, show: permissions.includes('view_scheduled') },
    { name: 'استلام السيارات', path: '/car-handovers', icon: Car, show: permissions.includes('view_car_handovers') },
    { name: 'تقارير الإيرادات', path: '/revenue-reports', icon: BarChart3, show: permissions.includes('view_revenue') },
    { name: 'لوحة الإدارة', path: '/admin', icon: Settings, show: permissions.includes('manage_system') },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300" dir="rtl">
      <NotificationManager />
      
      {/* Notifications Area */}
      <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className={cn("pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white dark:bg-slate-900", 
              n.type === 'error' ? "border-red-500 text-red-600" : "border-emerald-500 text-emerald-600")}>
              {n.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="font-bold text-sm">{n.message}</span>
              <button onClick={() => removeNotification(n.id)}><X size={14} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar & Navigation */}
      <aside className={cn("bg-white dark:bg-slate-900 shadow-lg hidden md:flex flex-col transition-all border-l border-gray-100 dark:border-slate-800", isSidebarCollapsed ? "w-20" : "w-72")}>
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && <span className="font-bold dark:text-white">نظام شركة سريع</span>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            {isSidebarCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all", 
              location.pathname === item.path ? "bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800")}>
              <item.icon size={20} />
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-slate-800">
           <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold">
             <LogOut size={20} />
             {!isSidebarCollapsed && <span>تسجيل الخروج</span>}
           </button>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8">
           <h2 className="font-bold dark:text-white">{navItems.find(i => i.path === location.pathname)?.name || 'الرئيسية'}</h2>
           <div className="flex items-center gap-4">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-500">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              {currentUser && <div className="text-sm font-bold dark:text-white">{currentUser.name}</div>}
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-950">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
