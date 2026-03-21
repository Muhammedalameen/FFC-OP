import React, { useState, useEffect } from 'react';
import { useStore, ShiftRevenue } from '../store';
import { Plus, Trash2, DollarSign, CreditCard, Truck, User, Download, Filter, Calendar, Building2, Save, FileText, Eye, Printer, X, Edit, FileEdit, Camera, Image as ImageIcon } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { exportToXLSX, exportToPDF, printReport } from '../lib/exportUtils';
import { getDefaultReportDate } from '../lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../lib/imageUtils';

import { cn } from '../lib/utils';

export default function Revenue() {
  const { currentUser, customRoles, branches, revenueReports, addRevenueReport, updateRevenueReport, deleteRevenueReport, addNotification, restoreRevenueReport } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Form State
  const [date, setDate] = useState(getDefaultReportDate());
  const [branchId, setBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [shifts, setShifts] = useState<Omit<ShiftRevenue, 'id'>[]>([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');
  const userBranches = branches.filter(b => canViewAll || b.id === currentUser?.branchId);

  // Filter State
  const [filterDate, setFilterDate] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filterBranch, setFilterBranch] = useState(canViewAll ? 'all' : currentUser?.branchId || '');

  // Load report data when editing
  useEffect(() => {
    if (editingReportId) {
      const report = revenueReports.find(r => r.id === editingReportId);
      if (report) {
        setBranchId(report.branchId);
        setDate(report.date);
        setShifts(report.shifts.map(s => ({ ...s })));
      }
    } else if (isAdding) {
      setShifts([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
    }
  }, [editingReportId, isAdding, revenueReports]);

  const handleAddShift = () => {
    setShifts([...shifts, { cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
  };

  const handleRemoveShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const handleShiftChange = (index: number, field: keyof Omit<ShiftRevenue, 'id'>, value: string) => {
    const newShifts = [...shifts];
    if (field === 'employeeName' || field === 'shiftReportImage') {
      newShifts[index][field] = value;
    } else {
      newShifts[index][field] = Number(value) || 0;
    }
    setShifts(newShifts);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        handleShiftChange(index, 'shiftReportImage', compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('حدث خطأ أثناء معالجة الصورة');
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    handleShiftChange(index, 'shiftReportImage', '');
  };

  const saveReport = (status: 'draft' | 'pending') => {
    if (!branchId) return;

    // Check if a report already exists for this date and branch
    const existingReport = revenueReports.find(r => r.branchId === branchId && r.date === date && r.id !== editingReportId);
    if (existingReport) {
      alert('عذراً، يوجد تقرير إيرادات مسجل مسبقاً لهذا الفرع في نفس التاريخ (حتى لو كان مسودة). لا يمكن إضافة أكثر من تقرير لنفس اليوم.');
      return;
    }

    // Validate images for pending status
    if (status === 'pending') {
      const missingImages = shifts.findIndex(s => !s.shiftReportImage);
      if (missingImages !== -1) {
        alert(`الرجاء إرفاق صورة تقرير المناوبة للوردية رقم ${missingImages + 1}`);
        return;
      }
    }

    if (editingReportId) {
      updateRevenueReport(editingReportId, {
        branchId,
        date,
        shifts: shifts.map(s => ({ ...s, id: s.id || Math.random().toString(36).substring(2, 9) })),
        status
      });
    } else {
      addRevenueReport({
        branchId,
        date,
        shifts: shifts.map(s => ({ ...s, id: Math.random().toString(36).substring(2, 9) })),
        createdBy: currentUser!.id,
        status
      });
    }
    setIsAdding(false);
    setEditingReportId(null);
    setShifts([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveReport('pending');
  };

  const handleSaveDraft = () => {
    saveReport('draft');
  };

  const handleEditReport = (report: any) => {
    setEditingReportId(report.id);
    setIsAdding(true);
  };

  const canAdd = userRole?.permissions.includes('add_reports') || userRole?.permissions.includes('add_revenue');
  const canEdit = userRole?.permissions.includes('edit_reports') || userRole?.permissions.includes('edit_revenue') || canAdd;
  const canDelete = userRole?.permissions.includes('delete_reports') || userRole?.permissions.includes('delete_revenue');

  const filteredReports = revenueReports.filter(r => {
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
      'الفرع': branches.find(b => b.id === r.branchId)?.name,
      'عدد الورديات': r.shifts.length,
      'إجمالي النقدي': r.shifts.reduce((sum, s) => sum + s.cash, 0),
      'إجمالي الشبكة': r.shifts.reduce((sum, s) => sum + s.pos, 0),
      'إجمالي التوصيل': r.shifts.reduce((sum, s) => sum + s.delivery, 0),
      'الإجمالي الكلي': r.shifts.reduce((sum, s) => sum + s.cash + s.pos + s.delivery, 0),
    }));
    exportToXLSX(data, `تقرير_الإيرادات_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportPDF = () => {
    const headers = ['التاريخ', 'الفرع', 'الورديات', 'نقدي', 'شبكة', 'توصيل', 'الإجمالي'];
    const data = filteredReports.map(r => [
      r.date,
      branches.find(b => b.id === r.branchId)?.name,
      r.shifts.length,
      r.shifts.reduce((sum, s) => sum + s.cash, 0).toFixed(2),
      r.shifts.reduce((sum, s) => sum + s.pos, 0).toFixed(2),
      r.shifts.reduce((sum, s) => sum + s.delivery, 0).toFixed(2),
      r.shifts.reduce((sum, s) => sum + s.cash + s.pos + s.delivery, 0).toFixed(2),
    ]);
    exportToPDF(headers, data, `تقرير_الإيرادات_${format(new Date(), 'yyyy-MM-dd')}`, 'تقرير الإيرادات اليومية');
  };

  const handleDeleteReport = (report: any) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      deleteRevenueReport(report.id);
      addNotification('تم حذف التقرير', 'success', 5000, () => {
        restoreRevenueReport(report);
      });
    }
  };

  const handlePrint = (report: any) => {
    const branch = branches.find(b => b.id === report.branchId);
    const totalCash = report.shifts.reduce((sum: number, s: any) => sum + s.cash, 0);
    const totalPos = report.shifts.reduce((sum: number, s: any) => sum + s.pos, 0);
    const totalDelivery = report.shifts.reduce((sum: number, s: any) => sum + s.delivery, 0);
    const grandTotal = totalCash + totalPos + totalDelivery;

    const content = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #4f46e5;">تقرير الإيراد اليومي</h1>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
          <div>
            <p><strong>الفرع:</strong> ${branch?.name}</p>
            <p><strong>التاريخ:</strong> ${report.date}</p>
          </div>
          <div style="text-align: left;">
            <p><strong>رقم التقرير:</strong> ${report.id}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">الوردية</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">الموظف</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">نقدي</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">شبكة</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">توصيل</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${report.shifts.map((s: any, i: number) => `
              <tr>
                <td style="border: 1px solid #e2e8f0; padding: 12px;">${i + 1}</td>
                <td style="border: 1px solid #e2e8f0; padding: 12px;">${s.employeeName}</td>
                <td style="border: 1px solid #e2e8f0; padding: 12px;">${s.cash.toLocaleString()} ر.س</td>
                <td style="border: 1px solid #e2e8f0; padding: 12px;">${s.pos.toLocaleString()} ر.س</td>
                <td style="border: 1px solid #e2e8f0; padding: 12px;">${s.delivery.toLocaleString()} ر.س</td>
                <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold;">${(s.cash + s.pos + s.delivery).toLocaleString()} ر.س</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="2" style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">الإجماليات</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">${totalCash.toLocaleString()} ر.س</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">${totalPos.toLocaleString()} ر.س</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">${totalDelivery.toLocaleString()} ر.س</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; color: #059669;">${grandTotal.toLocaleString()} ر.س</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 200px;">
            <p style="border-bottom: 1px solid #000; padding-bottom: 40px;">توقيع المحاسب</p>
          </div>
          <div style="text-align: center; width: 200px;">
            <p style="border-bottom: 1px solid #000; padding-bottom: 40px;">توقيع مدير الفرع</p>
          </div>
        </div>
      </div>
    `;
    printReport(content);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإيرادات اليومية</h1>
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
                setEditingReportId(null);
                setIsAdding(!isAdding);
                setShifts([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
                setDate(getDefaultReportDate());
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={20} />
              <span>إضافة تقرير</span>
            </button>
          )}
        </div>
      </div>

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

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              {editingReportId ? 'تعديل تقرير إيراد' : 'تقرير إيراد جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                {canViewAll && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">الفرع</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                      disabled={!!editingReportId}
                    >
                      <option value="">اختر الفرع</option>
                      {userBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white">الورديات</h3>
                  <button type="button" onClick={handleAddShift} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">
                    + إضافة وردية
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {shifts.map((shift, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 relative group">
                      <div className="absolute top-4 left-4">
                        {shifts.length > 1 && (
                          <button type="button" onClick={() => handleRemoveShift(index)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">تفاصيل الوردية</h4>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1"><User size={14}/> اسم الموظف</label>
                          <input
                            type="text"
                            value={shift.employeeName}
                            onChange={(e) => handleShiftChange(index, 'employeeName', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            placeholder="اسم الموظف"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1"><DollarSign size={14}/> إيراد نقدي</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shift.cash || ''}
                            onChange={(e) => handleShiftChange(index, 'cash', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1"><CreditCard size={14}/> إيراد الشبكة</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shift.pos || ''}
                            onChange={(e) => handleShiftChange(index, 'pos', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1"><Truck size={14}/> إيراد التوصيل</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shift.delivery || ''}
                            onChange={(e) => handleShiftChange(index, 'delivery', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <ImageIcon size={14} /> صورة تقرير المناوبة (إلزامي)
                        </label>
                        {shift.shiftReportImage ? (
                          <div className="relative inline-block">
                            <img src={shift.shiftReportImage} alt="تقرير المناوبة" className="w-32 h-32 object-cover rounded-xl border border-gray-200 dark:border-slate-700" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full md:w-64 h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Camera className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 dark:text-slate-400 font-bold">التقاط صورة التقرير</p>
                              <p className="text-xs text-gray-400 mt-1">من كاميرا الجوال فقط</p>
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              capture="environment"
                              onChange={(e) => handleImageUpload(index, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {/* Draft badge removed */}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingReportId(null); }} className="px-6 py-2 text-gray-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                    إلغاء
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveDraft}
                    className="px-6 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2"
                  >
                    <FileEdit size={18} />
                    <span>حفظ كمسودة</span>
                  </button>
                  <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                    {editingReportId ? 'تحديث التقرير' : 'حفظ التقرير النهائي'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الرقم المرجعي</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الفرع</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الورديات</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي النقدي</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي الشبكة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي التوصيل</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الإجمالي الكلي</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الحالة</th>
                {(canDelete || canEdit) && <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 w-20">إجراء</th>}
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 w-20">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredReports.map((report) => {
                const branch = branches.find(b => b.id === report.branchId);
                const totalCash = report.shifts.reduce((sum, s) => sum + s.cash, 0);
                const totalPos = report.shifts.reduce((sum, s) => sum + s.pos, 0);
                const totalDelivery = report.shifts.reduce((sum, s) => sum + s.delivery, 0);
                const grandTotal = totalCash + totalPos + totalDelivery;

                return (
                  <motion.tr 
                    key={report.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono font-bold">#{report.referenceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{report.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{branch?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {report.shifts.map((s, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400" title={s.employeeName}>
                            {s.employeeName.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{totalCash.toLocaleString()} ر.س</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{totalPos.toLocaleString()} ر.س</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{totalDelivery.toLocaleString()} ر.س</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">{grandTotal.toLocaleString()} ر.س</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        report.status === 'draft' ? "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400" :
                        report.status === 'approved' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                        report.status === 'rejected' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {report.status === 'draft' ? 'مسودة' :
                         report.status === 'approved' ? 'معتمد' :
                         report.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    {(canDelete || canEdit) && (
                      <td className="px-6 py-4 text-sm flex items-center gap-2">
                        {report.status === 'draft' && canEdit && (
                          <button onClick={() => handleEditReport(report)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
                            <Edit size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteReport(report)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => setSelectedReport(report)} className="text-indigo-500 hover:text-indigo-700 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={40} className="text-gray-200 dark:text-slate-800" />
                      <p>لا توجد تقارير إيرادات ضمن الفلاتر المحددة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل تقرير الإيراد</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">#{selectedReport.referenceNumber} - {branches.find(b => b.id === selectedReport.branchId)?.name} - {selectedReport.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrint(selectedReport)}
                  className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="طباعة التقرير"
                >
                  <Printer size={20} />
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">إجمالي النقدي</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {selectedReport.shifts.reduce((sum: number, s: any) => sum + s.cash, 0).toLocaleString()} ر.س
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">إجمالي الشبكة</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {selectedReport.shifts.reduce((sum: number, s: any) => sum + s.pos, 0).toLocaleString()} ر.س
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">إجمالي التوصيل</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {selectedReport.shifts.reduce((sum: number, s: any) => sum + s.delivery, 0).toLocaleString()} ر.س
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">الإجمالي الكلي</p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {selectedReport.shifts.reduce((sum: number, s: any) => sum + s.cash + s.pos + s.delivery, 0).toLocaleString()} ر.س
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" />
                  تفاصيل الورديات
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedReport.shifts.map((shift: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{shift.employeeName}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">موظف الوردية</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 md:max-w-2xl">
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">نقدي</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{shift.cash.toLocaleString()} ر.س</p>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">شبكة</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{shift.pos.toLocaleString()} ر.س</p>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">توصيل</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{shift.delivery.toLocaleString()} ر.س</p>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase">إجمالي الوردية</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{(shift.cash + shift.pos + shift.delivery).toLocaleString()} ر.س</p>
                        </div>
                      </div>
                      {shift.shiftReportImage && (
                        <div className="mt-4 md:mt-0 md:mr-4 shrink-0">
                          <a href={shift.shiftReportImage} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={shift.shiftReportImage} alt="تقرير المناوبة" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-slate-700 hover:opacity-80 transition-opacity" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800/50 p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 font-bold rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                إغلاق
              </button>
              <button 
                onClick={() => handlePrint(selectedReport)}
                className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <Printer size={18} />
                <span>طباعة التقرير</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
