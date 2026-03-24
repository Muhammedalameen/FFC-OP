import React, { useState, useMemo, useEffect } from 'react';
import { useStore, initFirebaseSync } from '../store';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Camera,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { format, parse, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { compressImage } from '../lib/imageUtils';

export default function ScheduledReadings() {
  const { 
    scheduledReadingItems, 
    readingRecords, 
    addReadingRecord, 
    currentUser,
    branches,
    customRoles
  } = useStore();

  useEffect(() => {
    initFirebaseSync(['scheduledReadingItems', 'readingRecords']);
  }, []);

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');
  const canAdd = userRole?.permissions.includes('add_reports') || userRole?.permissions.includes('add_scheduled');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [tempImages, setTempImages] = useState<Record<string, string[]>>({});
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const recordsForDay = useMemo(() => {
    return readingRecords.filter(r => r.date === dateStr && r.branchId === selectedBranchId);
  }, [readingRecords, dateStr, selectedBranchId]);

  const scheduledTasks = useMemo(() => {
    const tasks: any[] = [];
    scheduledReadingItems.forEach(item => {
      // Check if this item applies to the selected branch
      if (item.branchIds && item.branchIds.length > 0 && !item.branchIds.includes(selectedBranchId)) {
        return; // Skip this item for this branch
      }

      const times = item.scheduledTimes || (item.scheduledTime ? [item.scheduledTime] : []);
      times.forEach(time => {
        tasks.push({ ...item, targetTime: time, taskKey: `${item.id}_${time}` });
      });
    });
    tasks.sort((a, b) => a.targetTime.localeCompare(b.targetTime));
    return tasks;
  }, [scheduledReadingItems, selectedBranchId]);

  const handleImageUpload = async (taskKey: string, e: React.ChangeEvent<HTMLInputElement>, maxPhotos: number) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const currentImages = tempImages[taskKey] || [];
      const remainingSlots = maxPhotos > 0 ? maxPhotos - currentImages.length : 1; // Default to 1 if not specified
      const filesToProcess = files.slice(0, remainingSlots);
      
      const compressedImages = await Promise.all(filesToProcess.map(f => compressImage(f)));
      
      setTempImages(prev => ({ 
        ...prev, 
        [taskKey]: [...(prev[taskKey] || []), ...compressedImages] 
      }));
    }
  };

  const removeTempImage = (taskKey: string, index: number) => {
    setTempImages(prev => {
      const next = { ...prev };
      if (next[taskKey]) {
        next[taskKey] = next[taskKey].filter((_, i) => i !== index);
        if (next[taskKey].length === 0) {
          delete next[taskKey];
        }
      }
      return next;
    });
  };

  const handleSaveReading = (item: any, value: string | number | boolean) => {
    if (!currentUser) return;

    const taskKey = item.taskKey;
    const requiredPhotos = item.requiredPhotosCount || 0;
    const currentImages = tempImages[taskKey] || [];

    if (requiredPhotos > 0 && currentImages.length < requiredPhotos) {
      alert(`عذراً، يجب إرفاق ${requiredPhotos} صور على الأقل`);
      return;
    }

    addReadingRecord({
      branchId: selectedBranchId,
      itemId: item.id,
      value,
      date: dateStr,
      time: format(new Date(), 'HH:mm'),
      scheduledTime: item.targetTime,
      recordedBy: currentUser.id,
      images: currentImages,
      image: currentImages[0] // For backward compatibility
    });
    
    // Clear temp images after saving
    setTempImages(prev => {
      const next = { ...prev };
      delete next[taskKey];
      return next;
    });
  };

  const categories = Array.from(new Set(scheduledTasks.map(item => item.category)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="text-blue-600" />
            القراءات المجدولة
          </h1>
          <p className="text-gray-500 dark:text-slate-400">تسجيل ومتابعة القراءات اليومية الدورية</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800">
          <button 
            onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 font-medium min-w-[150px] justify-center">
            <CalendarIcon size={18} className="text-blue-600" />
            {format(selectedDate, 'EEEE, d MMMM', { locale: arSA })}
          </div>
          <button 
            onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">الفرع</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
              disabled={!canViewAll}
            >
              {branches
                .filter(b => canViewAll || b.id === currentUser?.branchId)
                .map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              ملخص اليوم
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">إجمالي المهام</span>
                <span className="font-bold">{scheduledTasks.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">تم إنجازه</span>
                <span className="text-green-600 font-bold">{recordsForDay.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">متبقي</span>
                <span className="text-amber-600 font-bold">{scheduledTasks.length - recordsForDay.length}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${scheduledTasks.length > 0 ? (recordsForDay.length / scheduledTasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          {categories.map(category => {
            const itemsInCategory = scheduledTasks.filter(item => item.category === category);
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 px-2 border-r-4 border-blue-600 mr-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {itemsInCategory.map((item, index) => {
                    const record = recordsForDay.find(r => r.itemId === item.id && (r.scheduledTime === item.targetTime || (!r.scheduledTime && !item.scheduledTimes)));
                    const isCompleted = !!record;
                    const requiredPhotos = item.requiredPhotosCount || 0;
                    const currentImages = tempImages[item.taskKey] || [];
                    const canSave = requiredPhotos === 0 || currentImages.length >= requiredPhotos;
                    
                    return (
                      <motion.div 
                        key={item.taskKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border transition-all",
                          isCompleted 
                            ? "border-green-100 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/5" 
                            : "border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/30"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-1 p-2 rounded-lg",
                              isCompleted ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800 dark:text-white">{item.name}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  الوقت المجدول: {format(parse(item.targetTime, 'HH:mm', new Date()), 'hh:mm a')}
                                </span>
                                {isCompleted && (
                                  <span className="text-green-600 font-medium">
                                    تم التسجيل بواسطة: {record.recordedBy} الساعة {format(parse(record.time, 'HH:mm', new Date()), 'hh:mm a')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                            {/* Image Upload/View */}
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <div className="flex gap-1">
                                  {(record.images || (record.image ? [record.image] : [])).map((img, i) => (
                                    <div key={i} className="relative group cursor-pointer" onClick={() => setViewingImage(img)}>
                                      <img 
                                        src={img} 
                                        alt="فحص" 
                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                      />
                                      <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon size={14} className="text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    {currentImages.map((img, i) => (
                                      <div key={i} className="relative">
                                        <img src={img} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                        <button
                                          onClick={() => removeTempImage(item.taskKey, i)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {(requiredPhotos === 0 || currentImages.length < requiredPhotos) && (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        multiple={requiredPhotos > 1}
                                        onChange={(e) => handleImageUpload(item.taskKey, e, requiredPhotos)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10 z-10"
                                        id={`img-${item.taskKey}`}
                                        disabled={!canAdd}
                                      />
                                      <button 
                                        className={cn(
                                          "p-2 rounded-lg border transition-all flex items-center justify-center w-10 h-10",
                                          !canAdd 
                                            ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                                            : "bg-gray-50 border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200"
                                        )}
                                        disabled={!canAdd}
                                      >
                                        <Camera size={20} />
                                      </button>
                                    </div>
                                  )}
                                  {requiredPhotos > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {currentImages.length}/{requiredPhotos} صور
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {item.type === 'number' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder={canSave ? "القيمة" : "صورة أولاً"}
                                  className="w-24 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-center disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-800"
                                  defaultValue={record?.value as number}
                                  disabled={isCompleted || !canSave || !canAdd}
                                  onBlur={(e) => {
                                    if (!isCompleted && e.target.value !== '' && canSave) {
                                      handleSaveReading(item, parseFloat(e.target.value));
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-500">{item.unit}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => !isCompleted && canSave && handleSaveReading(item, true)}
                                disabled={isCompleted || !canSave || !canAdd}
                                className={cn(
                                  "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                                  isCompleted
                                    ? "bg-green-100 text-green-700 cursor-default"
                                    : (!canSave || !canAdd)
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                )}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 size={18} />
                                    تم الفحص
                                  </>
                                ) : (
                                  <>
                                    <Save size={18} />
                                    تسجيل الفحص
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewingImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewingImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
              >
                <X size={24} />
              </button>
              <img 
                src={viewingImage} 
                alt="صورة الفحص" 
                className="w-full h-full object-contain rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
