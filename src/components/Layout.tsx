import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
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
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, subDays, parseISO } from 'date-fns';

export default function Layout() {
  const { currentUser, customRoles, logout, theme, setTheme, changeUserPin, revenueReports, inventoryReports, notifications, removeNotification } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [missingReports, setMissingReports] = useState<{ type: 'revenue' | 'inventory', date: string }[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Check for missing reports for the last 3 days (excluding today)
    const checkMissingReports = () => {
      const missing = [];
      const today = new Date();
      
      // Check yesterday
      const yesterday = subDays(today, 1);
      const dateStr = format(yesterday, 'yyyy-MM-dd');
      
      // Check Revenue
      const hasRevenue = revenueReports.some(r => r.date === dateStr && r.branchId === currentUser.branchId);
      if (!hasRevenue && !currentUser.roleId.includes('r4') && !currentUser.roleId.includes('r5')) {
         if (currentUser.roleId === 'r1' || currentUser.roleId === 'r2' || (currentUser.roleId === 'r3' && currentUser.branchId)) {
             missing.push({ type: 'revenue', date: dateStr });
         }
      }

      // Check Inventory
      const hasInventory = inventoryReports.some(r => r.date === dateStr && r.branchId === currentUser.branchId);
      if (!hasInventory && (currentUser.roleId === 'r1' || currentUser.roleId === 'r2' || (currentUser.roleId === 'r3' && currentUser.branchId))) {
          missing.push({ type: 'inventory', date: dateStr });
      }

      setMissingReports(missing as any);
    };

    checkMissingReports();
  }, [currentUser, revenueReports, inventoryReports]);

  if (!currentUser) {
    return <Outlet />;
  }

  const userRole = customRoles.find(r => r.id === currentUser.roleId);
  const permissions = userRole?.permissions || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
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
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'الإيرادات اليومية', path: '/revenue', icon: DollarSign, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'جرد المخزون', path: '/inventory', icon: Package, show: !permissions.includes('view_maintenance_only') },
    { name: 'القراءات المجدولة', path: '/scheduled-readings', icon: Clock, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'مراجعة التقارير', path: '/review-reports', icon: CheckCircle2, show: permissions.includes('approve_reports') || permissions.includes('manage_system') },
    { name: 'تقارير الإيرادات', path: '/revenue-reports', icon: BarChart3, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'تقارير الاستهلاك', path: '/reports', icon: BarChart3, show: !permissions.includes('view_maintenance_only') },
    { name: 'تقرير الاحتياج', path: '/need-report', icon: AlertCircle, show: !permissions.includes('view_maintenance_only') },
    { name: 'تقارير التشغيل', path: '/inspection', icon: ClipboardCheck, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'طلبات الصيانة', path: '/maintenance', icon: Wrench, show: !permissions.includes('view_inventory_only') },
    { name: 'طلبات الشراء', path: '/purchase', icon: ShoppingCart, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'لوحة الإدارة', path: '/admin', icon: Settings, show: permissions.includes('manage_system') },
  ];

  const filteredNavItems = navItems.filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300" dir="rtl">
      {/* Notifications Toast */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-left-full duration-300",
              notification.type === 'success' ? "bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400" :
              notification.type === 'error' ? "bg-white dark:bg-slate-900 border-red-500 text-red-600 dark:text-red-400" :
              "bg-white dark:bg-slate-900 border-blue-500 text-blue-600 dark:text-blue-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> :
             notification.type === 'error' ? <AlertCircle size={20} /> :
             <Info size={20} />}
            <span className="font-bold text-sm">{notification.message}</span>
            <button onClick={() => removeNotification(notification.id)} className="mr-2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 shadow-sm p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <img 
            src="https://i.ibb.co/8L8Wx06M/Logo-Saree-1.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">نظام المتابعة</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-slate-400">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "bg-white dark:bg-slate-900 shadow-lg flex-shrink-0 md:flex flex-col transition-all duration-300 z-20 border-l border-gray-100 dark:border-slate-800",
        isMobileMenuOpen ? "fixed inset-0 w-full" : "hidden md:flex",
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

        <div className={cn("px-4 mb-4 hidden md:block", isSidebarCollapsed && "px-2")}>
           {!isSidebarCollapsed ? (
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
                onClick={() => setIsMobileMenuOpen(false)}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto relative">
        {/* Alerts Banner */}
        {missingReports.length > 0 && (
          <div className="mb-6 space-y-2">
            {missingReports.map((report, idx) => (
              <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-200 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span className="font-bold">
                  تنبيه: لم يتم تسجيل {report.type === 'revenue' ? 'إيراد' : 'جرد مخزون'} ليوم أمس ({report.date})
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

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
