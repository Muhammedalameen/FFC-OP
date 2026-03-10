import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Lock, User, ChefHat, ArrowRight, Database, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isDbConnected, checkDbConnection } = useStore();
  const navigate = useNavigate();

  const handleCheckConnection = async () => {
    setIsChecking(true);
    await checkDbConnection();
    setIsChecking(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDbConnected === false) return;
    
    setIsLoggingIn(true);
    
    // Simulate network delay for the loading screen
    setTimeout(() => {
      const success = login(employeeId, pin);
      if (success) {
        navigate('/');
      } else {
        setError('الرقم الوظيفي أو كود الدخول غير صحيح');
        setIsLoggingIn(false);
      }
    }, 1500);
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
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <AnimatePresence mode="wait">
            {isDbConnected === false && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 overflow-hidden"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">فشل الاتصال بقاعدة البيانات</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
                      لا يمكن تسجيل الدخول حالياً بسبب وجود مشكلة في الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت أو المحاولة مرة أخرى.
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckConnection}
                      disabled={isChecking}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
                      {isChecking ? 'جاري التحقق...' : 'إعادة محاولة الاتصال'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

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
          </div>

          <motion.button
            whileHover={isDbConnected !== false ? { scale: 1.02 } : {}}
            whileTap={isDbConnected !== false ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isDbConnected === false || isDbConnected === null}
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
      </motion.div>
    </div>
    </>
  );
}
