import React, { useState, useEffect } from 'react';
import { useStore, InventoryReportItem } from '../store';
import { Plus, Trash2, Save, Download, Filter, Calendar, Building2, Package, AlertTriangle, Eye, Printer, X, FileText } from 'lucide-react';
import { format, subDays, isWithinInterval, parseISO, isAfter } from 'date-fns';
import { exportToXLSX, exportToPDF, printReport } from '../lib/exportUtils';
import { getDefaultReportDate } from '../lib/dateUtils';
import { cn } from '../lib/utils';

export default function Inventory() {
  const { currentUser, customRoles, branches, inventoryItems, inventoryReports, addInventoryReport, deleteInventoryReport } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Form State
  const [date, setDate] = useState(getDefaultReportDate());
  const [branchId, setBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [items, setItems] = useState<InventoryReportItem[]>([]);

  // Calculate average consumption for an item in a branch
  const getAvgConsumption = (itemId: string, bId: string) => {
    // Filter reports for this branch from the last 30 days to get a good average
    const thirtyDaysAgo = subDays(new Date(), 30);
    const relevantReports = inventoryReports.filter(r => 
      r.branchId === bId && isAfter(parseISO(r.date), thirtyDaysAgo)
    );
    
    if (relevantReports.length === 0) return 0;
    
    const totalCons = relevantReports.reduce((sum, r) => {
      const item = r.items.find(i => i.itemId === itemId);
      return sum + (item?.consumption || 0);
    }, 0);
    
    return totalCons / relevantReports.length;
  };

  // Filter State
  const [filterDate, setFilterDate] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filterBranch, setFilterBranch] = useState('all');

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const permissions = userRole?.permissions || [];
  const canViewAll = permissions.includes('view_all_branches') || permissions.includes('view_inventory_only');
  const canAdd = permissions.includes('add_reports') && !permissions.includes('view_inventory_only');
  const canDelete = permissions.includes('delete_reports') && !permissions.includes('view_inventory_only');

  // Load items for the selected branch
  useEffect(() => {
    if (isAdding && branchId) {
      const branchItems = inventoryItems.filter(i => i.branchIds.includes(branchId));
      
      // Try to find previous day's closing stock
      const prevDate = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
      const prevReport = inventoryReports.find(r => r.branchId === branchId && r.date === prevDate);

      const initialItems = branchItems.map(item => {
        const prevItem = prevReport?.items.find(i => i.itemId === item.id);
        return {
          itemId: item.id,
          opening: prevItem ? prevItem.closing : 0,
          received: 0,
          waste: 0,
          closing: 0,
          need: 0,
          consumption: 0
        };
      });
      setItems(initialItems);
    }
  }, [isAdding, branchId, date, inventoryItems, inventoryReports]);

  const handleItemChange = (index: number, field: keyof InventoryReportItem, value: string) => {
    const newItems = [...items];
    const numValue = Number(value) || 0;
    newItems[index][field] = numValue;
    
    // Auto calculate consumption: opening + received - closing
    const item = newItems[index];
    item.consumption = (item.opening || 0) + (item.received || 0) - (item.closing || 0);
    
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    addInventoryReport({
      branchId,
      date,
      items,
      createdBy: currentUser!.id,
      status: 'pending'
    });
    setIsAdding(false);
  };

  const filteredReports = inventoryReports.filter(r => {
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
      'عدد الأصناف': r.items.length,
    }));
    exportToXLSX(data, `تقرير_الجرد_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportPDF = () => {
    const headers = ['التاريخ', 'الفرع', 'عدد الأصناف'];
    const data = filteredReports.map(r => [
      r.date,
      branches.find(b => b.id === r.branchId)?.name,
      r.items.length,
    ]);
    exportToPDF(headers, data, `تقرير_الجرد_${format(new Date(), 'yyyy-MM-dd')}`, 'تقرير جرد المخزون');
  };

  const handlePrintNeedReport = (report: any) => {
    const branch = branches.find(b => b.id === report.branchId);
    const itemsWithNeed = report.items.filter((i: any) => i.need > 0);

    const content = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #4f46e5;">تقرير الاحتياج (طلب بضاعة)</h1>
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
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">الصنف</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">الوحدة</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">الكمية المطلوبة</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithNeed.map((item: any) => {
              const invItem = inventoryItems.find(i => i.id === item.itemId);
              return `
                <tr>
                  <td style="border: 1px solid #e2e8f0; padding: 12px;">${invItem?.name}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 12px;">${invItem?.unit}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold;">${item.need}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 12px;"></td>
                </tr>
              `;
            }).join('')}
            ${itemsWithNeed.length === 0 ? '<tr><td colspan="4" style="text-align: center; padding: 20px;">لا يوجد احتياج مسجل</td></tr>' : ''}
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 200px;">
            <p style="border-bottom: 1px solid #000; padding-bottom: 40px;">توقيع المستلم</p>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">جرد المخزون</h1>
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
              <span>إضافة جرد</span>
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">تقرير جرد جديد</h2>
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

            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الصنف</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">مجموعة المنتج</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-24">الوحدة</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-28">أول المدة</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-28">الوارد</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-28">الهدر</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-28">آخر المدة</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-28 text-center">الاستهلاك</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 w-28">الاحتياج</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {items.map((item, index) => {
                    const invItem = inventoryItems.find(i => i.id === item.itemId);
                    if (!invItem) return null;
                    return (
                      <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{invItem.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{invItem.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{invItem.unit}</td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.opening ?? ''} onChange={(e) => handleItemChange(index, 'opening', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.received ?? ''} onChange={(e) => handleItemChange(index, 'received', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.waste ?? ''} onChange={(e) => handleItemChange(index, 'waste', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.closing ?? ''} onChange={(e) => handleItemChange(index, 'closing', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-xl px-2 py-1 text-sm text-gray-700 dark:text-slate-300 font-bold text-center">
                            {item.consumption.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={item.need ?? ''} 
                              onChange={(e) => handleItemChange(index, 'need', e.target.value)} 
                              className={cn(
                                "w-full bg-white dark:bg-slate-900 border rounded-xl px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all",
                                item.need > (getAvgConsumption(item.itemId, branchId) * 1.25) && getAvgConsumption(item.itemId, branchId) > 0
                                  ? "border-amber-500 ring-1 ring-amber-500 bg-amber-50 dark:bg-amber-900/10" 
                                  : "border-gray-200 dark:border-slate-700"
                              )} 
                            />
                            {item.need > (getAvgConsumption(item.itemId, branchId) * 1.25) && getAvgConsumption(item.itemId, branchId) > 0 && (
                              <div className="absolute -top-2 -left-2 bg-amber-500 text-white rounded-full p-1 shadow-lg z-10" title={`تنبيه: متوسط الاستهلاك اليومي هو ${getAvgConsumption(item.itemId, branchId).toFixed(2)}`}>
                                <AlertTriangle size={12} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Package size={40} className="text-gray-200 dark:text-slate-800" />
                          <p>لا توجد أصناف مخزون لهذا الفرع</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={items.length === 0} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                <Save size={18} /> حفظ الجرد
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الرقم المرجعي</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الفرع</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">عدد الأصناف</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الحالة</th>
                {canDelete && <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 w-20">إجراء</th>}
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 w-20">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredReports.map((report) => {
                const branch = branches.find(b => b.id === report.branchId);
                return (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono font-bold">#{report.referenceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{report.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{branch?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{report.items.length}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        report.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        report.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {report.status === 'approved' ? 'مقبول' : report.status === 'rejected' ? 'مرفوض' : 'معلق'}
                      </span>
                    </td>
                    {canDelete && (
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => deleteInventoryReport(report.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
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
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={40} className="text-gray-200 dark:text-slate-800" />
                      <p>لا توجد تقارير جرد ضمن الفلاتر المحددة</p>
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل تقرير الجرد</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">#{selectedReport.referenceNumber} - {branches.find(b => b.id === selectedReport.branchId)?.name} - {selectedReport.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrintNeedReport(selectedReport)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm font-bold"
                  title="طباعة تقرير الاحتياج"
                >
                  <Printer size={18} />
                  <span>طباعة طلب البضاعة</span>
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الصنف</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الوحدة</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">أول المدة</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الوارد</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الهدر</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">آخر المدة</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الاستهلاك</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300">الاحتياج</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {selectedReport.items.map((item: any) => {
                      const invItem = inventoryItems.find(i => i.id === item.itemId);
                      return (
                        <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{invItem?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{invItem?.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.opening}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.received}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.waste}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.closing}</td>
                          <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.consumption}</td>
                          <td className="px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.need}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800/50 p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 font-bold rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
