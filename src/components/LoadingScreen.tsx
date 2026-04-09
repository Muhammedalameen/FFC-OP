import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = "جاري التحميل..." }: { message?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col items-center justify-center"
      dir="rtl"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-indigo-100 dark:border-slate-800 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-4 border-indigo-600 border-t-transparent rounded-full flex items-center justify-center bg-white dark:bg-slate-900 shadow-xl"
        >
          <img 
            src="https://i.ibb.co/8L8Wx06M/Logo-Saree-1.png" 
            alt="Saree Logo" 
            className="w-16 h-16 object-contain animate-pulse"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center space-y-2"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">شركة سريع الغذائية</h2>
        <p className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          {message}
        </p>
      </motion.div>
    </motion.div>
  );
}
