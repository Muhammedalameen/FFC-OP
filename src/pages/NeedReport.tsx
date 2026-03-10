import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Filter, Calendar, Building2, Package, Search, Eye, X, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { exportToXLSX, exportToPDF, printReport } from '../lib/exportUtils';

export default function NeedReport() {
  const { currentUser, customRoles, branches, inventoryItems, inventoryReports } = useStore();

  // Filter State
  const [filterDate, setFilterDate] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filterBranch, setFilterBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');

  // 1. Filter Reports
  const filteredReports = inventoryReports.filter(r => {
    const dateMatch = isWithinInterval(parseISO(r.date), {
      start: parseISO(filterDate.start),
      end: parseISO(filterDate.end)
    });
    const branchMatch = filterBranch === 'all' ? true : r.branchId === filterBranch;
    const permissionMatch = canViewAll ? true : r.branchId === currentUser?.branchId;
    
    // Only include reports that have items with need > 0
    const hasNeeds = r.items.some(item => item.need > 0);

    return dateMatch && branchMatch && permissionMatch && hasNeeds;
  }).map(report => {
    const branchName = branches.find(b => b.id === report.branchId)?.name || 'غير معروف';
    const itemsWithNeeds = report.items
      .filter(item => item.need > 0)
      .map(item => ({
        ...item,
        itemName: inventoryItems.find(i => i.id === item.itemId)?.name || 'صنف محذوف',
        category: inventoryItems.find(i => i.id === item.itemId)?.category || '-',
        unit: inventoryItems.find(i => i.id === item.itemId)?.unit || '-'
      }));
    
    return {
      ...report,
      branchName,
      itemsWithNeeds,
      totalItems: itemsWithNeeds.length,
      totalQuantity: itemsWithNeeds.reduce((sum, item) => sum + item.need, 0)
    };
  }).filter(report => 
    report.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportXLSX = () => {
    const data = filteredReports.flatMap(r => r.itemsWithNeeds.map(item => ({
      'التاريخ': r.date,
      'الفرع': r.branchName,
      'مجموعة المنتج': item.category,
      'الصنف': item.itemName,
      'الوحدة': item.unit,
      'الكمية المطلوبة': item.need
    })));
    exportToXLSX(data, `تقرير_الاحتياج_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportPDF = () => {
    const headers = ['التاريخ', 'الفرع', 'مجموعة المنتج', 'الصنف', 'الوحدة', 'الكمية'];
    const data = filteredReports.flatMap(r => r.itemsWithNeeds.map(item => [
      r.date,
      r.branchName,
      item.category,
      item.itemName,
      item.unit,
      item.need.toString()
    ]));
    exportToPDF(headers, data, `تقرير_الاحتياج_${format(new Date(), 'yyyy-MM-dd')}`, 'تقرير احتياج المواد');
  };

  const handlePrintNeedReport = (report: any) => {
    const branch = branches.find(b => b.id === report.branchId);
    const itemsWithNeed = report.itemsWithNeeds || report.items.filter((i: any) => i.need > 0).map((item: any) => ({
        ...item,
        itemName: inventoryItems.find(i => i.id === item.itemId)?.name || 'صنف محذوف',
        category: inventoryItems.find(i => i.id === item.itemId)?.category || '-',
        unit: inventoryItems.find(i => i.id === item.itemId)?.unit || '-'
    }));

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
            ${itemsWithNeed.map((item: any) => `
                <tr>
                  <td style="border: 1px solid #e2e8f0; padding: 12px;">${item.itemName}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 12px;">${item.unit}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold;">${item.need}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 12px;"></td>
                </tr>
              `).join('')}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تقرير الاحتياج (حسب الطلبات)</h1>
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
            placeholder="بحث عن فرع..." 
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
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">عدد الأصناف</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">إجمالي الكمية</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredReports.map((report, index) => (
                <tr key={`${report.id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{report.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{report.branchName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{report.totalItems}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-bold">
                      {report.totalQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button 
                      onClick={() => setSelectedReport(report)}
                      className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                    >
                      <Eye size={16} />
                      عرض الأصناف
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={40} className="text-gray-200 dark:text-slate-800" />
                      <p>لا توجد طلبات احتياج مسجلة ضمن الفلاتر المحددة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:absolute print:inset-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-w-none print:h-auto print:max-h-none">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center print:hidden">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="text-indigo-600" />
                تفاصيل طلب الاحتياج
              </h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-8 text-center border-b border-gray-200 mb-6">
              <h1 className="text-2xl font-bold mb-2">تقرير طلب احتياج</h1>
              <p className="text-gray-600">الفرع: {selectedReport.branchName}</p>
              <p className="text-gray-600">التاريخ: {selectedReport.date}</p>
              <p className="text-gray-500 text-sm mt-2">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd hh:mm a')}</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 print:overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl print:bg-gray-50 print:border print:border-gray-200">
                  <span className="text-xs text-gray-400 block mb-1">الفرع</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.branchName}</span>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl print:bg-gray-50 print:border print:border-gray-200">
                  <span className="text-xs text-gray-400 block mb-1">التاريخ</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.date}</span>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl print:bg-gray-50 print:border print:border-gray-200">
                  <span className="text-xs text-gray-400 block mb-1">عدد الأصناف</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{selectedReport.totalItems}</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white mb-4">قائمة الأصناف المطلوبة</h3>
              <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden print:border-gray-300">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400">الصنف</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400">مجموعة المنتج</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400">الوحدة</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400">الكمية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 print:divide-gray-200">
                    {selectedReport.itemsWithNeeds.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{item.itemName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{item.unit}</td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.need}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 print:hidden">
              <button 
                onClick={() => handlePrintNeedReport(selectedReport)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Printer size={18} />
                طباعة التقرير
              </button>
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold"
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
