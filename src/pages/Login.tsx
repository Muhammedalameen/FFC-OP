import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Lock, User, ChefHat, ArrowRight, Database, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isDbConnected, checkDbConnection, users, isLoading } = useStore();
  const navigate = useNavigate();

  const handleCheckConnection = async () => {
    setIsChecking(true);
    await checkDbConnection();
    setIsChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (users.length === 0 && !isLoading) {
      setError('لا يوجد مستخدمين مسجلين في النظام. يرجى التواصل مع الإدارة.');
      return;
    }

    setIsLoggingIn(true);
    
    // Simulate network delay for the loading screen
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const success = await login(employeeId, pin, rememberMe);
      if (success) {
        navigate('/');
      } else {
        setError('الرقم الوظيفي أو كود الدخول غير صحيح');
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLoggingIn && <LoadingScreen message="جاري تسجيل الدخول..." />}
      </AnimatePresence>
      
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
      >
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-3xl mb-6 shadow-xl border border-white/50 overflow-hidden p-4"
          >
            <img 
              src="https://i.ibb.co/8L8Wx06M/Logo-Saree-1.png" 
              alt="Saree Food Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">نظام المتابعة</h1>
          <p className="text-indigo-100 font-medium">شركة سريع الغذائية</p>
        </div>
        
        {isDbConnected === false ? (
          <div className="p-10 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 mb-4 mx-auto">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">النظام غير متصل</h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت أو المحاولة مرة أخرى لاحقاً.
            </p>
            <button
              type="button"
              onClick={handleCheckConnection}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'جاري التحقق...' : 'إعادة محاولة الاتصال'}
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <AnimatePresence mode="wait">
            {isDbConnected === true && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-3 flex items-center gap-2 overflow-hidden"
              >
                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-800 dark:text-green-200">تم تأكيد الاتصال بقاعدة البيانات</span>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium text-center border border-red-100 dark:border-red-900/30"
            >
              {error}
            </motion.div>
          )}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 mr-1">الرقم الوظيفي</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="block w-full pl-4 pr-12 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-all outline-none"
                  placeholder="أدخل الرقم الوظيفي"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 mr-1">كود الدخول</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full pl-4 pr-12 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-all outline-none"
                  placeholder="أدخل كود الدخول"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <label className="relative flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="mr-3 text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">تذكرني على هذا الجهاز</span>
              </label>
            </div>
          </div>

          <motion.button
            whileHover={isDbConnected !== null ? { scale: 1.02 } : {}}
            whileTap={isDbConnected !== null ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isDbConnected === null}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDbConnected === null ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                جاري التحقق من الاتصال...
              </>
            ) : (
              <>
                تسجيل الدخول
                <ArrowRight className="h-5 w-5 rotate-180" />
              </>
            )}
          </motion.button>
        </form>
        )}
      </motion.div>
    </div>
    </>
  );
}
