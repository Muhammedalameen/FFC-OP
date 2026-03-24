import React, { useState, useEffect } from 'react';
import { useStore, InspectionReportItem, initFirebaseSync } from '../store';
import { Plus, Trash2, Save, CheckCircle, XCircle, MinusCircle, Calendar, Building2, Download, Filter } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { exportToXLSX, exportToPDF } from '../lib/exportUtils';
import { getDefaultReportDate, getDefaultFilterRange } from '../lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Inspection() {
  const { currentUser, customRoles, branches, operationalItems, inspectionReports, addInspectionReport, deleteInspectionReport, addNotification, restoreInspectionReport } = useStore();
  
  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');
  const userBranches = branches.filter(b => canViewAll || b.id === currentUser?.branchId);
  const canAdd = userRole?.permissions.includes('add_reports');
  const canDelete = userRole?.permissions.includes('delete_reports');

  // Filter State
  const [filterDate, setFilterDate] = useState(getDefaultFilterRange());
  const [filterBranch, setFilterBranch] = useState(canViewAll ? 'all' : currentUser?.branchId || '');

  useEffect(() => {
    initFirebaseSync(['operationalItems', 'inspectionReports'], filterDate);
  }, [filterDate]);

  // Initialize form state when editing
  // No useEffect needed for initializing form state from real-time data arrays
  // as it causes data loss when Firebase updates.
  // The form is initialized in onSubmit of step 1.

  const [isAdding, setIsAdding] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [date, setDate] = useState(getDefaultReportDate());
  const [branchId, setBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [items, setItems] = useState<InspectionReportItem[]>([]);

  const handleItemChange = (index: number, field: keyof InspectionReportItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    addInspectionReport({
      branchId,
      date,
      items,
      createdBy: currentUser!.id
    });
    setIsAdding(false);
    setAddStep(1);
  };

  const filteredReports = inspectionReports.filter(r => {
    const dateMatch = isWithinInterval(parseISO(r.date), {
      start: parseISO(filterDate.start),
      end: parseISO(filterDate.end)
    });
    const branchMatch = filterBranch === 'all' ? true : r.branchId === filterBranch;
    const permissionMatch = canViewAll ? true : r.branchId === currentUser?.branchId;
    return dateMatch && branchMatch && permissionMatch;
  });

  const handleExportXLSX = () => {
    const data = filteredReports.map(r => ({
      'التاريخ': r.date,
      'الفرع': branches.find(b => b.id === r.branchId)?.name || '',
      'مطابق': r.items.filter(i => i.status === 'pass').length,
      'غير مطابق': r.items.filter(i => i.status === 'fail').length,
      'N/A': r.items.filter(i => i.status === 'na').length,
    }));
    exportToXLSX(data, `تقارير_التشغيل_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportPDF = () => {
    const headers = ['التاريخ', 'الفرع', 'مطابق', 'غير مطابق', 'N/A'];
    const data = filteredReports.map(r => [
      r.date,
      branches.find(b => b.id === r.branchId)?.name || '',
      r.items.filter(i => i.status === 'pass').length.toString(),
      r.items.filter(i => i.status === 'fail').length.toString(),
      r.items.filter(i => i.status === 'na').length.toString(),
    ]);
    exportToPDF(headers, data, `تقارير_التشغيل_${format(new Date(), 'yyyy-MM-dd')}`, 'تقارير التشغيل');
  };

  const handleDeleteReport = (report: any) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      deleteInspectionReport(report.id);
      addNotification('تم حذف التقرير', 'success', 5000, () => {
        restoreInspectionReport(report);
      });
    }
  };

  // Group operational items by category
  const categories = Array.from(new Set(operationalItems.map(i => i.category)));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تقارير التشغيل</h1>
        {!isAdding && (
          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-1 shadow-sm">
              <button onClick={handleExportXLSX} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg transition-colors" title="تصدير Excel">
                <Download size={20} />
              </button>
              <button onClick={handleExportPDF} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg transition-colors" title="تصدير PDF">
                <Filter size={20} className="rotate-90" />
              </button>
            </div>
            {canAdd && (
              <button
                onClick={() => {
                  setIsAdding(!isAdding);
                  setAddStep(1);
                  setDate(getDefaultReportDate());
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 font-bold"
              >
                <Plus size={20} />
                <span>{isAdding ? 'إلغاء' : 'إضافة تقرير'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!isAdding && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input type="date" value={filterDate.start} onChange={e => setFilterDate(prev => ({ ...prev, start: e.target.value }))} className="bg-transparent border-none text-sm text-gray-600 dark:text-slate-300 focus:ring-0" />
            <span className="text-gray-400">إلى</span>
            <input type="date" value={filterDate.end} onChange={e => setFilterDate(prev => ({ ...prev, end: e.target.value }))} className="bg-transparent border-none text-sm text-gray-600 dark:text-slate-300 focus:ring-0" />
          </div>
          <div className="h-6 w-px bg-gray-100 dark:bg-slate-800 hidden md:block" />
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="bg-transparent border-none text-sm text-gray-600 dark:text-slate-300 focus:ring-0 outline-none" disabled={!canViewAll}>
              {canViewAll && <option value="all">كافة الفروع</option>}
              {userBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">تقرير تشغيل جديد</h2>
            
            {addStep === 1 ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!branchId) {
                  alert('الرجاء اختيار الفرع');
                  return;
                }
                const existingReport = inspectionReports.find(r => r.branchId === branchId && r.date === date);
                if (existingReport) {
                  alert('عذراً، يوجد تقرير تشغيل مسجل مسبقاً لهذا الفرع في نفس التاريخ. لا يمكن إضافة أكثر من تقرير لنفس اليوم.');
                  return;
                }
                setItems(operationalItems.map(item => ({
                  itemId: item.id,
                  status: 'na',
                  notes: ''
                })));
                setAddStep(2);
              }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                  {canViewAll && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">الفرع</label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                        required
                      >
                        <option value="">اختر الفرع</option>
                        {userBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
                  <button type="button" onClick={() => { setIsAdding(false); setAddStep(1); }} className="px-6 py-2 text-gray-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                    إلغاء
                  </button>
                  <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                    التالي
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mb-1">التاريخ</span>
                    <span className="font-bold text-gray-900 dark:text-white">{date}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mb-1">الفرع</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {branches.find(b => b.id === branchId)?.name || 'غير محدد'}
                    </span>
                  </div>
                </div>

                <div className="space-y-10">
                {categories.map(category => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{category}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {items.map((item, index) => {
                        const opItem = operationalItems.find(i => i.id === item.itemId);
                        if (!opItem || opItem.category !== category) return null;
                        
                        return (
                          <div key={item.itemId} className="flex flex-col lg:flex-row lg:items-center gap-6 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md">
                            <div className="lg:w-1/3 font-bold text-gray-900 dark:text-white text-lg">{opItem.name}</div>
                            <div className="flex gap-2 lg:w-1/3">
                              <button
                                type="button"
                                onClick={() => handleItemChange(index, 'status', 'pass')}
                                className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                  item.status === 'pass' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <CheckCircle size={18} /> مطابق
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemChange(index, 'status', 'fail')}
                                className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                  item.status === 'fail' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <XCircle size={18} /> غير مطابق
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemChange(index, 'status', 'na')}
                                className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                  item.status === 'na' ? 'bg-slate-600 text-white shadow-lg shadow-slate-500/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <MinusCircle size={18} /> N/A
                              </button>
                            </div>
                            <div className="lg:w-1/3">
                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                placeholder="ملاحظات (اختياري)"
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                    <p className="text-gray-500 dark:text-slate-400">لا توجد بنود تشغيل مسجلة</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={() => { setIsAdding(false); setAddStep(1); }} className="px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl font-bold transition-colors">
                  إلغاء
                </button>
                <button type="button" onClick={() => setAddStep(1)} className="px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl font-bold transition-colors">
                  السابق
                </button>
                <button type="submit" disabled={items.length === 0} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-lg shadow-indigo-500/20 transition-all">
                  <Save size={20} /> حفظ التقرير
                </button>
              </div>
            </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الفرع</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 text-center">مطابق</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 text-center">غير مطابق</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 text-center">N/A</th>
                {canDelete && <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredReports.map((report) => {
                const branch = branches.find(b => b.id === report.branchId);
                const passCount = report.items.filter(i => i.status === 'pass').length;
                const failCount = report.items.filter(i => i.status === 'fail').length;
                const naCount = report.items.filter(i => i.status === 'na').length;
                return (
                  <motion.tr 
                    key={report.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{report.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{branch?.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">
                        {passCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-bold">
                        {failCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-sm font-bold">
                        {naCount}
                      </span>
                    </td>
                    {canDelete && (
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => handleDeleteReport(report)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 6 : 5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    لا توجد تقارير تشغيل مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
