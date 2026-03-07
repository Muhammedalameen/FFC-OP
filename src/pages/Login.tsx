import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Lock, User, ChefHat, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(employeeId, pin);
    if (success) {
      navigate('/');
    } else {
      setError('الرقم الوظيفي أو كود الدخول غير صحيح');
    }
  };

  return (
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all"
          >
            تسجيل الدخول
            <ArrowRight className="h-5 w-5 rotate-180" />
          </motion.button>
          
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
            <p className="text-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-4">بيانات تجريبية سريعة</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'مدير النظام', id: 'admin', pin: 'admin' },
                { label: 'مدير منطقة', id: '1001', pin: '1234' },
                { label: 'موظف فرع', id: '2001', pin: '1234' }
              ].map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => {
                    setEmployeeId(demo.id);
                    setPin(demo.pin);
                  }}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                >
                  <span>{demo.label}</span>
                  <span className="text-xs text-gray-400 font-mono">{demo.id} / {demo.pin}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
