import React, { useState, useMemo, useEffect } from 'react';
import { useStore, initFirebaseSync } from '../store';
import { useNavigate } from 'react-router-dom';
import { Activity, DollarSign, Package, Wrench, Calendar, Building2, Filter, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { getDefaultFilterRange } from '../lib/dateUtils';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { currentUser, customRoles, branches, revenueReports, inventoryReports, tickets, scheduledReadingItems, readingRecords, users } = useStore();

  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState(getDefaultFilterRange());
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    initFirebaseSync(['revenueReports', 'inventoryReports', 'tickets', 'scheduledReadingItems', 'readingRecords'], dateRange);
  }, [dateRange]);

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');

  useEffect(() => {
    if (userRole?.permissions.includes('view_maintenance_only')) {
      navigate('/maintenance', { replace: true });
    } else if (userRole?.permissions.includes('view_inventory_only')) {
      navigate('/need-report', { replace: true });
    } else if (!canViewAll && currentUser) {
      // Redirect branch employees to revenue or inventory
      navigate('/revenue', { replace: true });
    }
  }, [userRole, navigate, canViewAll, currentUser]);

  if (userRole?.permissions.includes('view_maintenance_only') || userRole?.permissions.includes('view_inventory_only') || (!canViewAll && currentUser)) {
    return null; // Render nothing while redirecting
  }

  const filterByDateAndBranch = (data: any[]) => {
    return data.filter(item => {
      const dateMatch = isWithinInterval(parseISO(item.date), {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end)
      });
      const branchMatch = selectedBranch === 'all' ? true : item.branchId === selectedBranch;
      const permissionMatch = canViewAll ? true : item.branchId === currentUser?.branchId;
      return dateMatch && branchMatch && permissionMatch;
    });
  };

  const filteredRevenue = filterByDateAndBranch(revenueReports);
  const filteredInventory = filterByDateAndBranch(inventoryReports);
  const filteredTickets = filterByDateAndBranch(tickets);

  const complianceStats = useMemo(() => {
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);
    const days = [];
    let current = start;
    while (current <= end) {
      days.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }

    let missedCount = 0;
    let lateCount = 0;
    let onTimeCount = 0;

    const relevantBranches = selectedBranch === 'all' 
      ? (canViewAll ? branches.map(b => b.id) : [currentUser?.branchId])
      : [selectedBranch];

    days.forEach(day => {
      relevantBranches.forEach(branchId => {
        if (!branchId) return;
        scheduledReadingItems.forEach(item => {
          // Check if this item applies to the current branch
          if (item.branchIds && item.branchIds.length > 0 && !item.branchIds.includes(branchId)) {
            return; // Skip this item for this branch
          }

          const times = item.scheduledTimes || (item.scheduledTime ? [item.scheduledTime] : []);
          
          times.forEach(time => {
            const record = readingRecords.find(r => r.itemId === item.id && r.branchId === branchId && r.date === day && (r.scheduledTime === time || (!r.scheduledTime && !item.scheduledTimes)));
            
            if (record) {
              // Check if late (simple string comparison works for HH:mm in 24h format)
              if (record.time > time) {
                lateCount++;
              } else {
                onTimeCount++;
              }
            } else {
              // If day is today, check if time passed
              if (day === format(new Date(), 'yyyy-MM-dd')) {
                const now = format(new Date(), 'HH:mm');
                if (now > time) {
                  missedCount++;
                }
              } else if (day < format(new Date(), 'yyyy-MM-dd')) {
                // Past day, definitely missed
                missedCount++;
              }
            }
          });
        });
      });
    });

    return { missed: missedCount, late: lateCount, onTime: onTimeCount };
  }, [dateRange, scheduledReadingItems, readingRecords, selectedBranch, canViewAll, currentUser, branches]);

  const stats = [
    { name: 'إجمالي الإيرادات', value: filteredRevenue.length, icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { name: 'تقارير الجرد', value: filteredInventory.length, icon: Package, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { name: 'طلبات الصيانة المفتوحة', value: filteredTickets.filter(t => t.type === 'maintenance' && t.status !== 'closed').length, icon: Wrench, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
    { name: 'تقارير فائتة', value: complianceStats.missed, icon: AlertCircle, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
    { name: 'تقارير متأخرة', value: complianceStats.late, icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة المعلومات</h1>
        
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 border-l border-gray-100 dark:border-slate-800">
            <Calendar size={18} className="text-gray-400" />
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent border-none text-sm text-gray-600 dark:text-slate-300 focus:ring-0"
            />
            <span className="text-gray-400">إلى</span>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent border-none text-sm text-gray-600 dark:text-slate-300 focus:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Building2 size={18} className="text-gray-400" />
            <select 
              value={selectedBranch} 
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-600 dark:text-slate-300 focus:ring-0 outline-none"
              disabled={!canViewAll}
            >
              <option value="all">كافة الفروع</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          {!canViewAll && (
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl text-xs font-medium text-gray-500 dark:text-slate-400">
              فرعك: {branches.find(b => b.id === currentUser?.branchId)?.name}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">نشاطات حديثة</h2>
            <Activity size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {(filteredTickets || []).slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${ticket.type === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'}`}>
                    {ticket.type === 'maintenance' ? <Wrench size={16} /> : <Activity size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{ticket.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>{ticket.date}</span>
                      <span>•</span>
                      <span>{branches.find(b => b.id === ticket.branchId)?.name}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  ticket.status === 'open' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                  ticket.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                }`}>
                  {ticket.status === 'open' ? 'مفتوح' : ticket.status === 'in_progress' ? 'قيد التنفيذ' : 'مغلق'}
                </span>
              </div>
            ))}
            {(filteredTickets || []).length === 0 && (
              <div className="text-center py-12">
                <Filter size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
                <p className="text-gray-500 dark:text-slate-400">لا توجد نشاطات ضمن الفلاتر المحددة</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">توزيع الإيرادات</h2>
          <div className="space-y-6">
            {branches.map(branch => {
              const branchRevenue = filteredRevenue.filter(r => r.branchId === branch.id);
              const total = branchRevenue.reduce((sum, r) => sum + r.shifts.reduce((sSum, s) => sSum + s.cash + s.pos + s.delivery, 0), 0);
              const maxTotal = Math.max(...branches.map(b => filteredRevenue.filter(r => r.branchId === b.id).reduce((sum, r) => sum + r.shifts.reduce((sSum, s) => sSum + s.cash + s.pos + s.delivery, 0), 0)), 1);
              const percentage = (total / maxTotal) * 100;

              return (
                <div key={branch.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-slate-300">{branch.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{total.toLocaleString()} ر.س</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {filteredRevenue.length === 0 && (
              <p className="text-center text-gray-500 dark:text-slate-400 py-8">لا توجد بيانات إيرادات</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
