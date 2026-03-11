import React, { useState } from 'react';
import { useStore, Ticket } from '../store';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Image as ImageIcon, Paperclip, Calendar, Building2, Search, Filter, AlertCircle, Package, DollarSign } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';

import { compressImage } from '../lib/imageUtils';

interface TicketsProps {
  type: 'maintenance' | 'purchase';
}

export default function Tickets({ type }: TicketsProps) {
  const navigate = useNavigate();
  const { currentUser, customRoles, branches, users, tickets, addTicket, updateTicketStatus, addTicketComment, deleteTicket } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branchId, setBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Maintenance specific
  const [equipmentName, setEquipmentName] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Purchase specific
  const [items, setItems] = useState<{ name: string; quantity: number; unit: string }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  // Filter State
  const [filterDate, setFilterDate] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filterBranch, setFilterBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const titleText = type === 'maintenance' ? 'طلبات الصيانة' : 'طلبات الشراء';
  const newText = type === 'maintenance' ? 'طلب صيانة جديد' : 'طلب شراء جديد';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const compressedImages = await Promise.all(Array.from(files).map((file: any) => compressImage(file)));
      setImages(prev => [...prev, ...compressedImages]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    if (type === 'maintenance' && images.length === 0) {
      alert('عذراً، لا بد من إرفاق صورة واحدة على الأقل لطلب الصيانة');
      return;
    }

    addTicket({
      branchId,
      date,
      title,
      description,
      status: 'open',
      comments: [],
      images,
      createdBy: currentUser!.id,
      type,
      equipmentName: type === 'maintenance' ? equipmentName : undefined,
      urgency: type === 'maintenance' ? urgency : undefined,
      items: type === 'purchase' ? items : undefined,
      estimatedCost: type === 'purchase' ? estimatedCost : undefined
    });
    
    setIsAdding(false);
    setTitle('');
    setDescription('');
    setImages([]);
    setEquipmentName('');
    setItems([]);
    setEstimatedCost(0);
  };

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const permissions = userRole?.permissions || [];
  
  const permissionType = type === 'maintenance' ? 'maintenance' : 'purchase';
  const canViewAll = permissions.includes('view_all_branches') || permissions.includes(`view_${permissionType}_only`) || permissions.includes(`view_${permissionType}`);
  const canAdd = (permissions.includes('add_reports') || permissions.includes(`add_${permissionType}`)) && !permissions.includes(`view_${permissionType}_only`);
  const canDelete = (permissions.includes('delete_reports') || permissions.includes(`delete_${permissionType}`)) && !permissions.includes(`view_${permissionType}_only`);

  const filteredTickets = tickets.filter(t => {
    if (t.type !== type) return false;
    
    const dateMatch = isWithinInterval(parseISO(t.date), {
      start: parseISO(filterDate.start),
      end: parseISO(filterDate.end)
    });
    const branchMatch = filterBranch === 'all' ? true : t.branchId === filterBranch;
    const permissionMatch = canViewAll ? true : t.branchId === currentUser?.branchId;
    const searchMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       t.description.toLowerCase().includes(searchTerm.toLowerCase());

    return dateMatch && branchMatch && permissionMatch && searchMatch;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{titleText}</h1>
        {canAdd && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 font-bold"
          >
            <Plus size={20} />
            <span>إضافة طلب</span>
          </button>
        )}
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
            {branches
              .filter(b => canViewAll || b.id === currentUser?.branchId)
              .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="h-6 w-px bg-gray-100 dark:bg-slate-800 hidden md:block" />
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="بحث في الطلبات..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none pr-10 text-sm text-gray-600 dark:text-slate-300 focus:ring-0 outline-none"
          />
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{newText}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">عنوان الطلب</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                required
                placeholder={type === 'maintenance' ? "مثال: تعطل مكيف الصالة" : "مثال: طلب مواد تنظيف شهرية"}
              />
            </div>

            {type === 'maintenance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">اسم المعدة / الجهاز</label>
                  <input
                    type="text"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="مثال: ثلاجة العرض"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">الأولوية</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>
            )}

            {type === 'purchase' && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">قائمة الأصناف المطلوبة</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="اسم الصنف"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="md:col-span-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="الكمية"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newItemName) {
                        setItems([...items, { name: newItemName, quantity: newItemQty, unit: newItemUnit }]);
                        setNewItemName('');
                        setNewItemQty(1);
                      }
                    }}
                    className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-bold"
                  >
                    إضافة صنف
                  </button>
                </div>
                {items.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                        <span className="font-bold">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{item.quantity} {item.unit}</span>
                          <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">التكلفة التقديرية (اختياري)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl pr-10 pl-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">التفاصيل</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none"
                required
                placeholder="يرجى كتابة تفاصيل الطلب هنا..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">المرفقات (صور)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-6 py-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-all font-bold">
                  <ImageIcon size={20} />
                  <span>اختر صور</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    capture={type === 'maintenance' ? "environment" : undefined}
                  />
                </label>
                <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">{images.length} صورة مرفقة</span>
              </div>
              {images.length > 0 && (
                <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                      <img src={img} alt="مرفق" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 dark:border-slate-800">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl font-bold transition-colors">
                إلغاء
              </button>
              <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20 transition-all">
                إرسال الطلب
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map(ticket => {
          const branch = branches.find(b => b.id === ticket.branchId);
          
          return (
            <div 
              key={ticket.id} 
              onClick={() => navigate(`/ticket/${ticket.id}`)}
              className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{ticket.title}</h3>
                  <span className="text-[10px] font-mono text-gray-400">#{ticket.referenceNumber || (ticket.id || '').toUpperCase().slice(0, 8)}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                  ticket.status === 'open' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                  ticket.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                  ticket.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}>
                  {ticket.status === 'open' ? 'مفتوح' : 
                   ticket.status === 'in_progress' ? 'قيد التنفيذ' : 
                   ticket.status === 'resolved' ? 'تم الحل' : 'مغلق'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
                  <Building2 size={14} className="text-indigo-500" />
                  <span>{branch?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{ticket.date}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <MessageSquare size={12}/> {(ticket.comments || []).length}
                  </span>
                  {(ticket.images || []).length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Paperclip size={12}/> {ticket.images.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">عرض التفاصيل ←</span>
              </div>
            </div>
          );
        })}
        {(filteredTickets || []).length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-3xl text-center text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800 border-dashed">
            لا توجد طلبات مسجلة
          </div>
        )}
      </div>
    </div>
  );
}
