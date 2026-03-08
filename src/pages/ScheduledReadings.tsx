import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
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
import { ar } from 'date-fns/locale';
import { cn } from '../lib/utils';

import { compressImage } from '../lib/imageUtils';

export default function ScheduledReadings() {
  const { 
    scheduledReadingItems, 
    readingRecords, 
    addReadingRecord, 
    currentUser,
    branches 
  } = useStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [tempImages, setTempImages] = useState<Record<string, string>>({});

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const recordsForDay = useMemo(() => {
    return readingRecords.filter(r => r.date === dateStr && r.branchId === selectedBranchId);
  }, [readingRecords, dateStr, selectedBranchId]);

  const handleImageUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setTempImages(prev => ({ ...prev, [itemId]: compressed }));
    }
  };

  const handleSaveReading = (itemId: string, value: string | number | boolean) => {
    if (!currentUser) return;

    if (!tempImages[itemId]) {
      alert('عذراً، لا يمكن حفظ القراءة بدون التقاط صورة توثيقية');
      return;
    }

    addReadingRecord({
      branchId: selectedBranchId,
      itemId,
      value,
      date: dateStr,
      time: format(new Date(), 'HH:mm'),
      recordedBy: currentUser.id,
      image: tempImages[itemId]
    });
    
    // Clear temp image after saving
    setTempImages(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const categories = Array.from(new Set(scheduledReadingItems.map(item => item.category)));

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
            {format(selectedDate, 'EEEE, d MMMM', { locale: ar })}
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
              disabled={!!currentUser?.branchId && currentUser.roleId !== 'r1'}
            >
              {branches.map(b => (
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
                <span className="font-bold">{scheduledReadingItems.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">تم إنجازه</span>
                <span className="text-green-600 font-bold">{recordsForDay.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">متبقي</span>
                <span className="text-amber-600 font-bold">{scheduledReadingItems.length - recordsForDay.length}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(recordsForDay.length / scheduledReadingItems.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          {categories.map(category => {
            const itemsInCategory = scheduledReadingItems.filter(item => item.category === category);
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 px-2 border-r-4 border-blue-600 mr-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {itemsInCategory.map(item => {
                    const record = recordsForDay.find(r => r.itemId === item.id);
                    const isCompleted = !!record;
                    
                    return (
                      <div 
                        key={item.id}
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
                                  الوقت المجدول: {item.scheduledTime}
                                </span>
                                {isCompleted && (
                                  <span className="text-green-600 font-medium">
                                    تم التسجيل بواسطة: {record.recordedBy} الساعة {record.time}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Image Upload/View */}
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                record.image && (
                                  <div className="relative group">
                                    <img 
                                      src={record.image} 
                                      alt="فحص" 
                                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImageIcon size={14} className="text-white" />
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleImageUpload(item.id, e)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
                                    id={`img-${item.id}`}
                                  />
                                  <button 
                                    className={cn(
                                      "p-2 rounded-lg border transition-all",
                                      tempImages[item.id] 
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200"
                                    )}
                                  >
                                    {tempImages[item.id] ? (
                                      <div className="relative">
                                        <img src={tempImages[item.id]} className="w-6 h-6 rounded object-cover" />
                                        <X 
                                          size={10} 
                                          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5" 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setTempImages(prev => {
                                              const next = { ...prev };
                                              delete next[item.id];
                                              return next;
                                            });
                                          }}
                                        />
                                      </div>
                                    ) : <Camera size={20} />}
                                  </button>
                                </div>
                              )}
                            </div>

                            {item.type === 'number' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder={tempImages[item.id] ? "القيمة" : "صورة أولاً"}
                                  className="w-24 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-center disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-800"
                                  defaultValue={record?.value as number}
                                  disabled={isCompleted || !tempImages[item.id]}
                                  onBlur={(e) => {
                                    if (!isCompleted && e.target.value !== '') {
                                      handleSaveReading(item.id, parseFloat(e.target.value));
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-500">{item.unit}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => !isCompleted && handleSaveReading(item.id, true)}
                                disabled={isCompleted || !tempImages[item.id]}
                                className={cn(
                                  "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                                  isCompleted
                                    ? "bg-green-100 text-green-700 cursor-default"
                                    : !tempImages[item.id]
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
