import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Filter, Calendar, Building2, Package, Search } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { exportToXLSX, exportToPDF } from '../lib/exportUtils';

export default function NeedReport() {
  const { currentUser, customRoles, branches, inventoryItems, inventoryReports } = useStore();

  // Filter State
  const [filterDate, setFilterDate] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filterBranch, setFilterBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');

  // Extract all "need" items from filtered reports
  const needs = inventoryReports.filter(r => {
    const dateMatch = isWithinInterval(parseISO(r.date), {
      start: parseISO(filterDate.start),
      end: parseISO(filterDate.end)
    });
    const branchMatch = filterBranch === 'all' ? true : r.branchId === filterBranch;
    const permissionMatch = canViewAll ? true : r.branchId === currentUser?.branchId;
    return dateMatch && branchMatch && permissionMatch;
  }).flatMap(report => 
    report.items
      .filter(item => item.need > 0)
      .map(item => ({
        ...item,
        date: report.date,
        branchId: report.branchId,
        branchName: branches.find(b => b.id === report.branchId)?.name || 'غير معروف',
        itemName: inventoryItems.find(i => i.id === item.itemId)?.name || 'صنف محذوف',
        category: inventoryItems.find(i => i.id === item.itemId)?.category || '-',
        unit: inventoryItems.find(i => i.id === item.itemId)?.unit || '-'
      }))
  ).filter(item => 
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportXLSX = () => {
    const data = needs.map(n => ({
      'التاريخ': n.date,
      'الفرع': n.branchName,
      'مجموعة المنتج': n.category,
      'الصنف': n.itemName,
      'الوحدة': n.unit,
      'الكمية المطلوبة': n.need
    }));
    exportToXLSX(data, `تقرير_الاحتياج_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportPDF = () => {
    const headers = ['التاريخ', 'الفرع', 'مجموعة المنتج', 'الصنف', 'الوحدة', 'الكمية'];
    const data = needs.map(n => [
      n.date,
      n.branchName,
      n.category,
      n.itemName,
      n.unit,
      n.need.toString()
    ]);
    exportToPDF(headers, data, `تقرير_الاحتياج_${format(new Date(), 'yyyy-MM-dd')}`, 'تقرير احتياج المواد');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تقرير الاحتياج</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-1 shadow-sm">
            <button onClick={handleExportXLSX} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg transition-colors" title="تصدير Excel">
              <Download size={20} />
            </button>
            <button onClick={handleExportPDF} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg transition-colors" title="تصدير PDF">
              <Filter size={20} className="rotate-90" />
            </button>
          </div>
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
        <div className="h-6 w-px bg-gray-100 dark:bg-slate-800 hidden md:block" />
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="بحث عن صنف أو فرع..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none pr-10 text-sm text-gray-600 dark:text-slate-300 focus:ring-0 outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الفرع</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">مجموعة المنتج</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الصنف</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الوحدة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الكمية المطلوبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {needs.map((need, index) => (
                <tr key={`${need.date}-${need.branchId}-${need.itemId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{need.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{need.branchName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{need.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">{need.itemName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{need.unit}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full font-bold">
                      {need.need}
                    </span>
                  </td>
                </tr>
              ))}
              {needs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={40} className="text-gray-200 dark:text-slate-800" />
                      <p>لا توجد احتياجات مسجلة ضمن الفلاتر المحددة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
