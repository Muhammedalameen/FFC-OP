import React, { useState, useEffect } from 'react';
import { useStore, initFirebaseSync } from '../store';
import { Plus, Search, Car, Calendar, User, FileText, Eye, Trash2, Gauge, Fuel, Printer, ArrowLeftRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { getDefaultFilterRange } from '../lib/dateUtils';

export default function CarHandovers() {
  const { carHandovers, cars, users, currentUser, customRoles, deleteCarHandover } = useStore();

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHandover, setSelectedHandover] = useState<any>(null);
  const [filterCarId, setFilterCarId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(getDefaultFilterRange().start);
  const [filterEndDate, setFilterEndDate] = useState(getDefaultFilterRange().end);

  useEffect(() => {
    initFirebaseSync(['cars', 'carHandovers'], {
      start: filterStartDate,
      end: filterEndDate
    });
  }, [filterStartDate, filterEndDate]);

  const userRole = currentUser ? customRoles.find(r => r.id === currentUser.roleId) : null;
  const permissions = userRole?.permissions || [];
  const canAdd = permissions.includes('add_car_handovers');
  const canManage = permissions.includes('manage_cars'); // Assuming manage_cars gives full access to handovers too, or just let them delete if they added it

  // Filter handovers based on search and user role
  // Drivers might only see their own handovers, while admins see all
  const isDriver = userRole?.name === 'سائق';
  
  const filteredHandovers = carHandovers.filter(h => {
    // If driver, only show their own
    if (isDriver && h.driverId !== currentUser?.id) return false;

    if (filterCarId && h.carId !== filterCarId) return false;

    if (filterStartDate && new Date(h.createdAt) < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(h.createdAt) > new Date(filterEndDate + 'T23:59:59')) return false;

    const car = cars.find(c => c.id === h.carId);
    const driver = users.find(u => u.id === h.driverId);
    
    const searchString = `${h.referenceNumber} ${car?.name} ${car?.plateNumber} ${driver?.name}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Car className="w-6 h-6 text-indigo-600" />
          عمليات استلام السيارات
        </h2>
        {canAdd && (
          <button
            onClick={() => navigate('/car-handovers/new')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            تسجيل استلام جديد
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="بحث برقم المرجع، اسم السيارة، اللوحة، أو اسم السائق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterCarId}
              onChange={(e) => setFilterCarId(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="">جميع السيارات</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>{car.name} - {car.plateNumber}</option>
              ))}
            </select>
            
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
              title="من تاريخ"
            />
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
              title="إلى تاريخ"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHandovers.map((handover) => {
            const car = cars.find(c => c.id === handover.carId);
            const driver = users.find(u => u.id === handover.driverId);

            return (
              <div key={handover.id} className="bg-gray-50 dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                        #{handover.referenceNumber}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        handover.status === 'closed' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {handover.status === 'closed' ? 'مغلق (تم التسليم)' : 'مفتوح (قيد الاستخدام)'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                      {car?.name || 'سيارة غير معروفة'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                      {car?.plateNumber}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {handover.status === 'open' && (canManage || handover.driverId === currentUser?.id) && (
                      <button
                        onClick={() => navigate(`/car-handovers/return/${handover.id}`)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                        title="تسليم السيارة"
                      >
                        <ArrowLeftRight size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedHandover(handover)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye size={18} />
                    </button>
                    {(canManage || handover.driverId === currentUser?.id) && (
                      <button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                            deleteCarHandover(handover.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="حذف السجل"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span>{driver?.name || 'سائق غير معروف'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{format(parseISO(handover.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: arSA })}</span>
                  </div>
                  {handover.expectedReturnDate && (
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <Calendar size={16} />
                      <span>متوقع التسليم: {format(parseISO(handover.expectedReturnDate), 'dd MMMM yyyy', { locale: arSA })}</span>
                    </div>
                  )}
                  {handover.status === 'closed' && handover.returnDate && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Calendar size={16} />
                      <span>
                        مدة الاستلام: {(() => {
                          const start = parseISO(handover.createdAt);
                          const end = parseISO(handover.returnDate);
                          const days = differenceInDays(end, start);
                          const hours = differenceInHours(end, start) % 24;
                          const minutes = differenceInMinutes(end, start) % 60;
                          
                          let durationStr = '';
                          if (days > 0) durationStr += `${days} يوم `;
                          if (hours > 0) durationStr += `${hours} ساعة `;
                          if (minutes > 0 || durationStr === '') durationStr += `${minutes} دقيقة`;
                          
                          return durationStr.trim();
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredHandovers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
              لا توجد سجلات استلام سيارات
            </div>
          )}
        </div>
      </div>

      {/* Handover Details Modal */}
      {selectedHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="text-indigo-600" />
                تقرير استلام سيارة #{selectedHandover.referenceNumber}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors flex items-center gap-2 font-bold print:hidden"
                >
                  <Printer size={20} />
                  <span className="hidden sm:inline">طباعة التقرير</span>
                </button>
                <button
                  onClick={() => setSelectedHandover(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors print:hidden"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8 print:p-0 print:space-y-6">
              {/* Report Header for Print */}
              <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6">
                <h2 className="text-2xl font-bold mb-2">تقرير استلام مركبة</h2>
                <p className="text-gray-600">رقم المرجع: {selectedHandover.referenceNumber}</p>
                <p className="text-gray-600">تاريخ التقرير: {format(new Date(), 'dd MMMM yyyy', { locale: arSA })}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-900 print:bg-white p-5 rounded-xl border border-gray-100 dark:border-slate-700 print:border-gray-300">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">السيارة</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {cars.find(c => c.id === selectedHandover.carId)?.name}
                  </p>
                  <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    {cars.find(c => c.id === selectedHandover.carId)?.plateNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">السائق</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {users.find(u => u.id === selectedHandover.driverId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">تاريخ الاستلام</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {format(parseISO(selectedHandover.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: arSA })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">موعد التسليم المتوقع</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {selectedHandover.expectedReturnDate 
                      ? format(parseISO(selectedHandover.expectedReturnDate), 'dd MMMM yyyy', { locale: arSA })
                      : 'غير محدد'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Gauge size={14} /> قراءة العداد
                  </p>
                  <p className="font-bold text-gray-800 dark:text-white font-mono">
                    {selectedHandover.odometerReading?.toLocaleString() || 'غير متوفر'} كم
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Fuel size={14} /> كمية الوقود
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          (selectedHandover.fuelLevel || 0) <= 20 ? 'bg-red-500' : 
                          (selectedHandover.fuelLevel || 0) <= 50 ? 'bg-yellow-500' : 
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${selectedHandover.fuelLevel || 0}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-sm text-gray-800 dark:text-white w-10 text-right">
                      {selectedHandover.fuelLevel || 0}%
                    </span>
                  </div>
                </div>
                <div className="col-span-full">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">سبب الاستلام</p>
                  <p className="font-bold text-gray-800 dark:text-white bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                    {selectedHandover.reason}
                  </p>
                </div>
                {selectedHandover.notes && (
                  <div className="col-span-full">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات الاستلام</p>
                    <p className="font-bold text-gray-800 dark:text-white bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                      {selectedHandover.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Photos Grid */}
              <div className="print:break-inside-avoid">
                <h4 className="font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 print:border-gray-300 pb-2">الصور المرفقة</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3">
                  <div className="space-y-2 print:break-inside-avoid">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">قراءة العداد</p>
                    <img src={selectedHandover.odometerImage} alt="عداد" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                  </div>
                  <div className="space-y-2 print:break-inside-avoid">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">الجانب الأيمن</p>
                    <img src={selectedHandover.rightSideImage} alt="يمين" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                  </div>
                  <div className="space-y-2 print:break-inside-avoid">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">الجانب الأيسر</p>
                    <img src={selectedHandover.leftSideImage} alt="يسار" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                  </div>
                  <div className="space-y-2 print:break-inside-avoid">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">أمام السيارة</p>
                    <img src={selectedHandover.frontImage} alt="أمام" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                  </div>
                  <div className="space-y-2 print:break-inside-avoid">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">خلف السيارة</p>
                    <img src={selectedHandover.backImage} alt="خلف" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                  </div>
                </div>
              </div>

              {/* Return Details */}
              {selectedHandover.status === 'closed' && (
                <div className="print:break-inside-avoid mt-8 border-t-2 border-dashed border-gray-200 dark:border-slate-700 pt-8">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
                    بيانات تسليم السيارة
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50 dark:bg-emerald-900/10 print:bg-white p-5 rounded-xl border border-emerald-100 dark:border-emerald-800/30 print:border-gray-300 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">تاريخ التسليم</p>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {selectedHandover.returnDate ? format(parseISO(selectedHandover.returnDate), 'dd MMMM yyyy - hh:mm a', { locale: arSA }) : 'غير متوفر'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">مدة الاستلام</p>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {(() => {
                          if (!selectedHandover.returnDate) return 'غير متوفر';
                          const start = parseISO(selectedHandover.createdAt);
                          const end = parseISO(selectedHandover.returnDate);
                          const days = differenceInDays(end, start);
                          const hours = differenceInHours(end, start) % 24;
                          const minutes = differenceInMinutes(end, start) % 60;
                          
                          let durationStr = '';
                          if (days > 0) durationStr += `${days} يوم `;
                          if (hours > 0) durationStr += `${hours} ساعة `;
                          if (minutes > 0 || durationStr === '') durationStr += `${minutes} دقيقة`;
                          
                          return durationStr.trim();
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Gauge size={14} /> قراءة العداد عند التسليم
                      </p>
                      <p className="font-bold text-gray-800 dark:text-white font-mono">
                        {selectedHandover.returnOdometerReading?.toLocaleString() || 'غير متوفر'} كم
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Fuel size={14} /> كمية الوقود عند التسليم
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (selectedHandover.returnFuelLevel || 0) <= 20 ? 'bg-red-500' : 
                              (selectedHandover.returnFuelLevel || 0) <= 50 ? 'bg-yellow-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${selectedHandover.returnFuelLevel || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-sm text-gray-800 dark:text-white w-10 text-right">
                          {selectedHandover.returnFuelLevel || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-full">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات التسليم</p>
                      <p className="font-bold text-gray-800 dark:text-white bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                        {selectedHandover.returnReason || 'لا توجد ملاحظات'}
                      </p>
                    </div>
                    {selectedHandover.returnNotes && (
                      <div className="col-span-full">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات إضافية للتسليم</p>
                        <p className="font-bold text-gray-800 dark:text-white bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                          {selectedHandover.returnNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 print:border-gray-300 pb-2">صور التسليم</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3">
                    <div className="space-y-2 print:break-inside-avoid">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">قراءة العداد</p>
                      <img src={selectedHandover.returnOdometerImage} alt="عداد التسليم" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                    </div>
                    <div className="space-y-2 print:break-inside-avoid">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">الجانب الأيمن</p>
                      <img src={selectedHandover.returnRightSideImage} alt="يمين التسليم" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                    </div>
                    <div className="space-y-2 print:break-inside-avoid">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">الجانب الأيسر</p>
                      <img src={selectedHandover.returnLeftSideImage} alt="يسار التسليم" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                    </div>
                    <div className="space-y-2 print:break-inside-avoid">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">أمام السيارة</p>
                      <img src={selectedHandover.returnFrontImage} alt="أمام التسليم" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                    </div>
                    <div className="space-y-2 print:break-inside-avoid">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">خلف السيارة</p>
                      <img src={selectedHandover.returnBackImage} alt="خلف التسليم" className="w-full h-48 print:h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-2xl print:hidden">
              <button
                onClick={() => setSelectedHandover(null)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-bold border border-gray-200 dark:border-slate-700"
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
