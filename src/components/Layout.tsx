import React from 'react';
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
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { currentUser, customRoles, logout, theme, setTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (!currentUser) {
    return <Outlet />;
  }

  const userRole = customRoles.find(r => r.id === currentUser.roleId);
  const permissions = userRole?.permissions || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard, show: true },
    { name: 'الإيرادات اليومية', path: '/revenue', icon: DollarSign, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'جرد المخزون', path: '/inventory', icon: Package, show: !permissions.includes('view_maintenance_only') },
    { name: 'القراءات المجدولة', path: '/scheduled-readings', icon: Clock, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'التقارير', path: '/reports', icon: BarChart3, show: !permissions.includes('view_maintenance_only') },
    { name: 'تقرير الاحتياج', path: '/need-report', icon: AlertCircle, show: !permissions.includes('view_maintenance_only') },
    { name: 'تقارير التشغيل', path: '/inspection', icon: ClipboardCheck, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'طلبات الصيانة', path: '/maintenance', icon: Wrench, show: !permissions.includes('view_inventory_only') },
    { name: 'طلبات الشراء', path: '/purchase', icon: ShoppingCart, show: !permissions.includes('view_maintenance_only') && !permissions.includes('view_inventory_only') },
    { name: 'لوحة الإدارة', path: '/admin', icon: Settings, show: permissions.includes('manage_system') },
  ];

  const filteredNavItems = navItems.filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300" dir="rtl">
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
        "bg-white dark:bg-slate-900 shadow-lg w-full md:w-72 flex-shrink-0 md:flex flex-col transition-all duration-300 z-20 border-l border-gray-100 dark:border-slate-800",
        isMobileMenuOpen ? "fixed inset-0" : "hidden md:flex"
      )}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden p-2 group-hover:scale-105 transition-transform">
              <img 
                src="https://i.ibb.co/8L8Wx06M/Logo-Saree-1.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">نظام المتابعة</h1>
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold mt-1">شركة سريع الغذائية</span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
            <p className="text-sm font-bold text-gray-900 dark:text-white">مرحباً، {currentUser.name}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">{userRole?.name}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20" 
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 dark:text-slate-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-2 rounded-2xl">
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

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors font-bold"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
