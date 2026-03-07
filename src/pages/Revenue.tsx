import React, { useState, useEffect } from 'react';
import { useStore, ShiftRevenue } from '../store';
import { Plus, Trash2, DollarSign, CreditCard, Truck, User, Download, Filter, Calendar, Building2, Save, FileText, Eye, Printer, X } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { exportToXLSX, exportToPDF, printReport } from '../lib/exportUtils';
import { getDefaultReportDate } from '../lib/dateUtils';

export default function Revenue() {
  const { currentUser, customRoles, branches, revenueReports, revenueDrafts, addRevenueReport, deleteRevenueReport, saveRevenueDraft } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Form State
  const [date, setDate] = useState(getDefaultReportDate());
  const [branchId, setBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [shifts, setShifts] = useState<Omit<ShiftRevenue, 'id'>[]>([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);

  // Filter State
  const [filterDate, setFilterDate] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filterBranch, setFilterBranch] = useState('all');

  // Load draft if exists
  useEffect(() => {
    if (isAdding) {
      const draft = revenueDrafts.find(d => d.branchId === branchId && d.date === date);
      if (draft) {
        setShifts(draft.shifts.map(s => ({ ...s })));
      } else {
        setShifts([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
      }
    }
  }, [date, branchId, isAdding]); // Removed revenueDrafts from dependencies to avoid overwriting while typing

  const handleAddShift = () => {
    setShifts([...shifts, { cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
  };

  const handleRemoveShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const handleShiftChange = (index: number, field: keyof Omit<ShiftRevenue, 'id'>, value: string) => {
    const newShifts = [...shifts];
    if (field === 'employeeName') {
      newShifts[index][field] = value;
    } else {
      newShifts[index][field] = Number(value) || 0;
    }
    setShifts(newShifts);
  };

  const handleSaveDraft = () => {
    if (!branchId) return;
    saveRevenueDraft({
      branchId,
      date,
      shifts: shifts.map(s => ({ ...s, id: Math.random().toString(36).substring(2, 9) })),
      createdBy: currentUser!.id,
    });
    // Optional: show toast or feedback
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    addRevenueReport({
      branchId,
      date,
      shifts: shifts.map(s => ({ ...s, id: Math.random().toString(36).substring(2, 9) })),
      createdBy: currentUser!.id,
    });
    setIsAdding(false);
    setShifts([{ cash: 0, pos: 0, delivery: 0, employeeName: '' }]);
  };

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');
  const canAdd = userRole?.permissions.includes('add_reports');
  const canDelete = userRole?.permissions.includes('delete_reports');

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
              onClick={() => setIsAdding(!isAdding)}
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
            <option value="all">كافة الفروع</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">تقرير إيراد جديد</h2>
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
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                      <button 
                        type="button" 
                        onClick={handleSaveDraft}
                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-all"
                        title="حفظ هذه الوردية كمسودة"
                      >
                        <Save size={14} />
                        <span>حفظ الوردية</span>
                      </button>
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
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {revenueDrafts.some(d => d.branchId === branchId && d.date === date) && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full animate-pulse">
                    <FileText size={14} />
                    يوجد مسودة محفوظة
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                  إلغاء
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveDraft}
                  className="px-6 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2"
                >
                  <Save size={18} />
                  <span>حفظ كمسودة</span>
                </button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                  حفظ التقرير النهائي
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الفرع</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الورديات</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي النقدي</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي الشبكة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي التوصيل</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الإجمالي الكلي</th>
                {canDelete && <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 w-20">إجراء</th>}
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
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
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
                    {canDelete && (
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => deleteRevenueReport(report.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => setSelectedReport(report)} className="text-indigo-500 hover:text-indigo-700 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
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
                  <p className="text-sm text-gray-500 dark:text-slate-400">{branches.find(b => b.id === selectedReport.branchId)?.name} - {selectedReport.date}</p>
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
