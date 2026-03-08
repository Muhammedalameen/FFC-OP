import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { DollarSign, Calendar, BarChart3, ArrowUpRight, Building2, Printer, Check, Clock, Filter, X } from 'lucide-react';
import { 
  format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, parseISO, isWithinInterval,
  subWeeks, subMonths, subYears, startOfDay, endOfDay
} from 'date-fns';
import { printReport } from '../lib/exportUtils';
import { cn } from '../lib/utils';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueReports() {
  const { revenueReports, branches } = useStore();
  
  // Applied Filters (Used for calculation)
  const [appliedBranches, setAppliedBranches] = useState<string[]>(['all']);
  const [appliedDateFilter, setAppliedDateFilter] = useState<'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'>('thisMonth');
  const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });

  // Temporary State (For UI controls)
  const [tempBranches, setTempBranches] = useState<string[]>(['all']);
  const [tempDateFilter, setTempDateFilter] = useState<'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'>('thisMonth');
  const [tempCustomRange, setTempCustomRange] = useState({ start: '', end: '' });

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (appliedDateFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'thisWeek':
        return { start: startOfWeek(now, { weekStartsOn: 6 }), end: endOfDay(now) };
      case 'lastWeek':
        const lastWeek = subWeeks(now, 1);
        return { start: startOfWeek(lastWeek, { weekStartsOn: 6 }), end: endOfWeek(lastWeek, { weekStartsOn: 6 }) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfDay(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'thisYear':
        return { start: startOfYear(now), end: endOfDay(now) };
      case 'lastYear':
        const lastYear = subYears(now, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case 'custom':
        if (appliedCustomRange.start && appliedCustomRange.end) {
          return { start: startOfDay(parseISO(appliedCustomRange.start)), end: endOfDay(parseISO(appliedCustomRange.end)) };
        }
        return { start: startOfMonth(now), end: endOfDay(now) };
      default:
        return { start: startOfMonth(now), end: endOfDay(now) };
    }
  }, [appliedDateFilter, appliedCustomRange]);

  const { stats, chartData } = useMemo(() => {
    const filteredRevenue = revenueReports.filter(r => {
      const date = parseISO(r.date);
      const inRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const inBranch = appliedBranches.includes('all') || appliedBranches.includes(r.branchId);
      return inRange && inBranch;
    });

    // Revenue Calculations
    const totalRevenue = filteredRevenue.reduce((sum, r) => 
      sum + r.shifts.reduce((sSum, s) => sSum + s.cash + s.pos + s.delivery, 0), 0);
    
    const daysDiff = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));

    // Chart Data
    const grouped = filteredRevenue.reduce((acc, r) => {
      const date = r.date;
      const total = r.shifts.reduce((sum, s) => sum + s.cash + s.pos + s.delivery, 0);
      acc[date] = (acc[date] || 0) + total;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date: format(parseISO(date), 'MM/dd'),
        revenue: total
      }));

    return {
      stats: {
        revenue: {
          total: totalRevenue,
          daily: totalRevenue / daysDiff,
        },
        days: daysDiff
      },
      chartData
    };
  }, [revenueReports, appliedBranches, dateRange]);

  const toggleBranch = (id: string) => {
    if (id === 'all') {
      setTempBranches(['all']);
      return;
    }
    
    const newBranches = tempBranches.filter(b => b !== 'all');
    if (newBranches.includes(id)) {
      const filtered = newBranches.filter(b => b !== id);
      setTempBranches(filtered.length === 0 ? ['all'] : filtered);
    } else {
      setTempBranches([...newBranches, id]);
    }
  };

  const applyFilters = () => {
    setAppliedBranches(tempBranches);
    setAppliedDateFilter(tempDateFilter);
    setAppliedCustomRange(tempCustomRange);
  };

  const clearFilters = () => {
    setTempBranches(['all']);
    setTempDateFilter('thisMonth');
    setTempCustomRange({ start: '', end: '' });
    
    setAppliedBranches(['all']);
    setAppliedDateFilter('thisMonth');
    setAppliedCustomRange({ start: '', end: '' });
  };

  const handlePrint = () => {
    const branchNames = appliedBranches.includes('all') ? 'كافة الفروع' : branches.filter(b => appliedBranches.includes(b.id)).map(b => b.name).join(', ');
    const dateRangeStr = `${format(dateRange.start, 'yyyy-MM-dd')} إلى ${format(dateRange.end, 'yyyy-MM-dd')}`;

    const content = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #4f46e5;">تقرير الإيرادات</h1>
        <div style="margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
          <p><strong>الفروع:</strong> ${branchNames}</p>
          <p><strong>الفترة:</strong> ${dateRangeStr}</p>
          <p><strong>تاريخ الاستخراج:</strong> ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 40px;">
          <div>
            <h2 style="color: #059669; border-right: 4px solid #059669; padding-right: 10px;">الإيرادات</h2>
            <p><strong>الإجمالي للفترة:</strong> ${stats.revenue.total.toLocaleString()} ر.س</p>
            <p><strong>المتوسط اليومي:</strong> ${stats.revenue.daily.toLocaleString()} ر.س</p>
          </div>
        </div>
      </div>
    `;
    printReport(content);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تقارير الإيرادات</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer size={18} />
            <span>طباعة</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800">
            <Calendar size={16} />
            <span>آخر تحديث: {format(new Date(), 'yyyy-MM-dd HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">الفترة الزمنية</h3>
            </div>
            <div className="space-y-3">
              <select
                value={tempDateFilter}
                onChange={(e) => setTempDateFilter(e.target.value as any)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="today">اليوم</option>
                <option value="yesterday">أمس</option>
                <option value="thisWeek">هذا الأسبوع</option>
                <option value="lastWeek">الأسبوع الماضي</option>
                <option value="thisMonth">هذا الشهر</option>
                <option value="lastMonth">الشهر الماضي</option>
                <option value="thisYear">هذا العام</option>
                <option value="lastYear">العام الماضي</option>
                <option value="custom">فترة مخصصة</option>
              </select>
              
              {tempDateFilter === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="date" 
                    value={tempCustomRange.start}
                    onChange={(e) => setTempCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="date" 
                    value={tempCustomRange.end}
                    onChange={(e) => setTempCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">تصفية حسب الفروع</h3>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              <button
                onClick={() => toggleBranch('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1",
                  tempBranches.includes('all')
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                )}
              >
                {tempBranches.includes('all') && <Check size={12} />}
                كافة الفروع
              </button>
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => toggleBranch(branch.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1",
                    tempBranches.includes(branch.id)
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                  )}
                >
                  {tempBranches.includes(branch.id) && <Check size={12} />}
                  {branch.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
          <button 
            onClick={clearFilters}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
          >
            <X size={18} />
            <span>مسح الفلتر</span>
          </button>
          <button 
            onClick={applyFilters}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Filter size={18} />
            <span>تطبيق الفلتر</span>
          </button>
        </div>
      </div>

      {/* Revenue Section */}
      <section className="space-y-4">

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <DollarSign size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">متوسط الإيرادات</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard 
            title="إجمالي الإيرادات" 
            value={stats.revenue.total} 
            subtitle={`إجمالي الفترة (${stats.days} يوم)`}
            icon={<DollarSign size={24} />}
            color="emerald"
          />
          <ReportCard 
            title="المتوسط اليومي" 
            value={stats.revenue.daily} 
            subtitle="متوسط الإيراد لكل يوم"
            icon={<BarChart3 size={24} />}
            color="indigo"
          />
          <ReportCard 
            title="نطاق الفترة" 
            value={stats.days} 
            subtitle="عدد الأيام المختارة"
            icon={<Calendar size={24} />}
            color="amber"
            isCount
          />
        </div>
      </section>

      {/* Detailed Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">نظرة عامة على الأداء</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm">تحليل البيانات التاريخية للفروع</p>
          </div>
        </div>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl">
              <p className="text-gray-400 dark:text-slate-600 italic">لا توجد بيانات كافية للعرض</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, value, subtitle, icon, color, isPercent, isCount }: { 
  title: string, 
  value: number, 
  subtitle: string, 
  icon: React.ReactNode,
  color: string,
  isPercent?: boolean,
  isCount?: boolean
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    violet: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  };

  const unit = isPercent ? '%' : isCount ? 'يوم' : (title.includes('إيراد') ? 'ر.س' : 'وحدة');

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
          <ArrowUpRight size={14} />
          <span>+12%</span>
        </div>
      </div>
      <h3 className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-1">{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-black text-gray-900 dark:text-white">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500 font-bold">
          {unit}
        </span>
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500">{subtitle}</p>
    </div>
  );
}
