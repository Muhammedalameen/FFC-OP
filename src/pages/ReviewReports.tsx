import React, { useState } from 'react';
import { useStore } from '../store';
import { Check, X, FileText, Calendar, Building2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

export default function ReviewReports() {
  const { revenueReports, inventoryReports, branches, updateRevenueReportStatus, updateInventoryReportStatus, users } = useStore();
  const [activeTab, setActiveTab] = useState<'revenue' | 'inventory'>('revenue');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const pendingRevenueReports = revenueReports.filter(r => r.status === 'pending');
  const pendingInventoryReports = inventoryReports.filter(r => r.status === 'pending');

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || 'Unknown Branch';
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown User';

  const toggleExpand = (id: string) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مراجعة التقارير</h1>
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('revenue')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'revenue'
                ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
            )}
          >
            تقارير الإيرادات
            {pendingRevenueReports.length > 0 && (
              <span className="mr-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingRevenueReports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'inventory'
                ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
            )}
          >
            تقارير المخزون
            {pendingInventoryReports.length > 0 && (
              <span className="mr-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingInventoryReports.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'revenue' && (
        <div className="space-y-4">
          {pendingRevenueReports.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">لا توجد تقارير معلقة</h3>
              <p className="text-gray-500 dark:text-slate-400">جميع تقارير الإيرادات تمت مراجعتها</p>
            </div>
          ) : (
            pendingRevenueReports.map(report => (
              <div key={report.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {getBranchName(report.branchId)}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-1">
                          #{report.referenceNumber}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {report.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {getUserName(report.createdBy)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateRevenueReportStatus(report.id, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="رفض"
                      >
                        <X size={20} />
                      </button>
                      <button
                        onClick={() => updateRevenueReportStatus(report.id, 'approved')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="قبول"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl mb-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-slate-400 block mb-1">إجمالي الإيراد</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {report.shifts.reduce((sum, s) => sum + s.cash + s.pos + s.delivery, 0).toLocaleString()} ر.س
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleExpand(report.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                      {expandedReport === report.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {expandedReport === report.id && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      {report.shifts.map((shift, idx) => (
                        <div key={shift.id} className="text-sm border-b border-gray-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                          <div className="flex justify-between font-bold mb-1">
                            <span>{shift.employeeName}</span>
                            <span>{(shift.cash + shift.pos + shift.delivery).toLocaleString()} ر.س</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-slate-400">
                            <span>نقدي: {shift.cash}</span>
                            <span>شبكة: {shift.pos}</span>
                            <span>توصيل: {shift.delivery}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {pendingInventoryReports.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">لا توجد تقارير معلقة</h3>
              <p className="text-gray-500 dark:text-slate-400">جميع تقارير المخزون تمت مراجعتها</p>
            </div>
          ) : (
            pendingInventoryReports.map(report => (
              <div key={report.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {getBranchName(report.branchId)}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-1">
                          #{report.referenceNumber}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {report.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {getUserName(report.createdBy)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateInventoryReportStatus(report.id, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="رفض"
                      >
                        <X size={20} />
                      </button>
                      <button
                        onClick={() => updateInventoryReportStatus(report.id, 'approved')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="قبول"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl mb-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-slate-400 block mb-1">عدد الأصناف</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {report.items.length} صنف
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleExpand(report.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                      {expandedReport === report.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {expandedReport === report.id && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                       {/* Ideally we would map items to names here, but for now just count */}
                       <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                         تفاصيل الأصناف متاحة في صفحة التقارير الكاملة بعد الموافقة.
                       </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
