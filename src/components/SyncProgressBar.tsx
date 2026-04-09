import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

export default function SyncProgressBar() {
  const { syncProgress, isLoading } = useStore();

  if (!syncProgress && !isLoading) return null;

  const percentage = syncProgress 
    ? Math.round((syncProgress.current / syncProgress.total) * 100)
    : 0;

  return (
    <AnimatePresence>
      {(syncProgress || isLoading) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-0 left-0 right-0 z-[100]"
        >
          {/* Indeterminate loader when we don't have specific progress but are loading */}
          {!syncProgress && isLoading && (
            <div className="h-1 w-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{ width: '40%' }}
              />
            </div>
          )}

          {/* Determinate loader when we have specific progress */}
          {syncProgress && (
            <div className="h-1 w-full bg-blue-100 dark:bg-blue-900/30">
              <motion.div
                className="h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute top-2 right-4 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 animate-pulse" />
                <span className="text-gray-700 dark:text-slate-200">
                  جاري المزامنة: {syncProgress.current} / {syncProgress.total} ({percentage}%)
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
