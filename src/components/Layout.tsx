import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import NotificationManager from './NotificationManager';
import { 
  LayoutDashboard, 
  DollarSign, 
  Package, 
  ClipboardCheck, 
  Wrench, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Menu,
  X,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  BarChart3,
  Clock,
  KeyRound,
  Bell,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  Download,
  Car
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, subDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { currentUser, users, customRoles, logout, theme, setTheme, changeUserPin, revenueReports, inventoryReports, notifications, removeNotification } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const userRole = currentUser ? customRoles.find(r => r.id === currentUser.roleId) : null;
  const permissions = userRole?.permissions || [];
  const noUsers = users.length === 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور غير متطابقة');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('كلمة المرور يجب أن تكون 4 أرقام/حروف على الأقل');
      return;
    }
    changeUserPin(currentUser.id, newPassword);
    setIsChangePasswordOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard, show: permissions.includes('view_all_branches') || noUsers },
    { name: 'الإيرادات اليومية', path: '/revenue', icon: DollarSign, show: permissions.includes('view_revenue') || noUsers },
    { name: 'جرد المخزون', path: '/inventory', icon: Package, show: permissions.includes('view_inventory') || noUsers },
    { name: 'القراءات المجدولة', path: '/scheduled-readings', icon: Clock, show: permissions.includes('view_scheduled') || noUsers },
    { name: 'استلام السيارات', path: '/car-handovers', icon: Car, show: permissions.includes('view_car_handovers') || noUsers },
    { name: 'تقارير الإيرادات', path: '/revenue-reports', icon: BarChart3, show: permissions.includes('view_revenue') || noUsers },
    { name: 'تقارير الاستهلاك', path: '/reports', icon: BarChart3, show: permissions.includes('manage_system') || noUsers },
    { name: 'طلبات التوريد', path: '/need-report', icon: AlertCircle, show: !permissions.includes('view_maintenance_only') || noUsers },
    { name: 'تقارير التشغيل', path: '/inspection', icon: ClipboardCheck, show: (!permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only')) || noUsers },
    { name: 'طلبات الصيانة', path: '/maintenance', icon: Wrench, show: !permissions.includes('view_inventory_only') || noUsers },
    { name: 'طلبات الشراء', path: '/purchase', icon: ShoppingCart, show: (!permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only')) || noUsers },
    { name: 'لوحة الإدارة', path: '/admin', icon: Settings, show: permissions.includes('manage_system') || noUsers },
  ];

  const filteredNavItems = navItems.filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300" dir="rtl">
      <NotificationManager />
      {/* Notifications Toast */}
      <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div 
              key={notification.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border",
                notification.type === 'success' ? "bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400" :
                notification.type === 'error' ? "bg-white dark:bg-slate-900 border-red-500 text-red-600 dark:text-red-400" :
                "bg-white dark:bg-slate-900 border-blue-500 text-blue-600 dark:text-blue-400"
              )}
            >
              {notification.type === 'success' ? <CheckCircle2 size={20} /> :
               notification.type === 'error' ? <AlertCircle size={20} /> :
               <Info size={20} />}
              <span className="font-bold text-sm">{notification.message}</span>
              {notification.undoAction && (
                <button 
                  onClick={() => {
                    notification.undoAction?.();
                    removeNotification(notification.id);
                  }}
                  className="mr-2 px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  تراجع
                </button>
              )}
              <button onClick={() => removeNotification(notification.id)} className="mr-2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-sm p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-2">
          <img 
            src="https://i.ibb.co/8L8Wx06M/Logo-Saree-1.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">نظام المتابعة</h1>
        </div>
        <div className="flex items-center gap-3">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors flex items-center gap-1"
              title="تثبيت التطبيق"
            >
              <Download size={18} />
              <span className="text-xs font-bold hidden sm:inline">تثبيت</span>
            </button>
          )}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {currentUser ? (
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-white dark:border-slate-900 shadow-sm"
            >
              {currentUser.name.charAt(0)}
            </button>
          ) : (
            <Link to="/login" className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <LogOut size={20} className="rotate-180" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile User Dropdown */}
      {isUserDropdownOpen && currentUser && (
        <div className="md:hidden fixed top-16 left-4 right-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-2 animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="p-3 border-b border-gray-100 dark:border-slate-800 mb-2">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">{userRole?.name}</p>
          </div>
          <button
            onClick={() => { setIsChangePasswordOpen(true); setIsUserDropdownOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            <KeyRound size={18} />
            تغيير كلمة المرور
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "bg-white dark:bg-slate-900 shadow-lg flex-shrink-0 hidden md:flex flex-col transition-all duration-300 z-50 border-l border-gray-100 dark:border-slate-800 print:hidden",
        isSidebarCollapsed ? "md:w-20" : "md:w-72"
      )}>
        <div className="p-4 hidden md:flex items-center justify-between">
           {!isSidebarCollapsed && (
             <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden p-1">
                  <img 
                    src="https://i.ibb.co/8L8Wx06M/Logo-Saree-1.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-gray-900 dark:text-white">نظام المتابعة</h1>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">شركة سريع</span>
                </div>
             </div>
           )}
           <button 
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 transition-colors"
           >
             {isSidebarCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
           </button>
        </div>

        <div className={cn("px-4 mb-4 mt-4 md:mt-0", isSidebarCollapsed && "px-2")}>
           {currentUser ? (
             !isSidebarCollapsed ? (
               <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in">
                 <p className="text-sm font-bold text-gray-900 dark:text-white truncate">مرحباً، {currentUser.name}</p>
                 <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 truncate">{userRole?.name}</p>
               </div>
             ) : (
               <div className="flex justify-center">
                 <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                   {currentUser.name.charAt(0)}
                 </div>
               </div>
             )
           ) : (
             !isSidebarCollapsed && (
               <Link to="/login" className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                 <LogOut size={18} className="rotate-180" />
                 <span>تسجيل الدخول</span>
               </Link>
             )
           )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20" 
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white",
                  isSidebarCollapsed && "justify-center px-2"
                )}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon size={20} className={cn("transition-transform group-hover:scale-110 flex-shrink-0", isActive ? "text-white" : "text-gray-400 dark:text-slate-500")} />
                {!isSidebarCollapsed && <span className="whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-200">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-2 rounded-2xl animate-in fade-in">
              <button 
                onClick={() => setTheme('light')}
                className={cn("p-2 rounded-xl transition-all", theme === 'light' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-gray-400")}
              >
                <Sun size={18} />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={cn("p-2 rounded-xl transition-all", theme === 'dark' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-gray-400")}
              >
                <Moon size={18} />
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={cn("p-2 rounded-xl transition-all", theme === 'system' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-gray-400")}
              >
                <Monitor size={18} />
              </button>
            </div>
          ) : (
             <button 
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="w-full p-3 flex justify-center rounded-xl bg-gray-50 dark:bg-slate-800/50 text-gray-500 hover:text-indigo-600"
             >
               {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
             </button>
          )}

          {currentUser && (
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 w-full text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors font-bold",
                isSidebarCollapsed && "justify-center px-2"
              )}
              title={isSidebarCollapsed ? "تغيير كلمة المرور" : undefined}
            >
              <KeyRound size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">تغيير كلمة المرور</span>}
            </button>
          )}

          {currentUser && (
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors font-bold",
                isSidebarCollapsed && "justify-center px-2"
              )}
              title={isSidebarCollapsed ? "تسجيل الخروج" : undefined}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">تسجيل الخروج</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-10 py-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {navItems.find(item => item.path === location.pathname)?.name || 'نظام المتابعة'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors font-bold text-sm"
              >
                <Download size={18} />
                تثبيت التطبيق
              </button>
            )}
            <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            
            <div className="h-8 w-px bg-gray-100 dark:bg-slate-800" />

            <div className="relative">
              {currentUser ? (
                <>
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors"
                  >
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">{userRole?.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border-2 border-white dark:border-slate-900 shadow-sm">
                      {currentUser.name.charAt(0)}
                    </div>
                  </button>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-2 animate-in zoom-in-95 duration-200 z-50">
                      <div className="p-2 border-b border-gray-100 dark:border-slate-800 mb-2 lg:hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">{userRole?.name}</p>
                      </div>
                      <button
                        onClick={() => { setIsChangePasswordOpen(true); setIsUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                      >
                        <KeyRound size={18} />
                        تغيير كلمة المرور
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium"
                      >
                        <LogOut size={18} />
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                  <LogOut size={18} className="rotate-180" />
                  <span>تسجيل الدخول</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 flex-1 pb-24 md:pb-10">
        
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-50 flex overflow-x-auto pb-safe hide-scrollbar print:hidden">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[72px] p-2 gap-1 transition-colors",
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon size={20} className={cn(isActive && "fill-indigo-100 dark:fill-indigo-900/30")} />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">تغيير كلمة المرور</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm font-bold">{passwordError}</p>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-6 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
