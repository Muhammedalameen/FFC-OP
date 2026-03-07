import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Ticket } from '../store';
import { 
  ArrowRight, 
  Trash2, 
  MessageSquare, 
  Image as ImageIcon, 
  Paperclip, 
  Calendar, 
  Building2, 
  Clock, 
  AlertCircle, 
  Package, 
  History,
  CheckCircle2,
  Circle,
  User as UserIcon,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentUser, 
    customRoles, 
    branches, 
    users, 
    tickets, 
    updateTicketStatus, 
    addTicketComment, 
    deleteTicket 
  } = useStore();
  
  const [commentText, setCommentText] = useState('');
  
  const ticket = tickets.find(t => t.id === id);
  
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" dir="rtl">
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400">
          <Search size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">الطلب غير موجود</h2>
        <button onClick={() => navigate(-1)} className="text-indigo-600 font-bold hover:underline">العودة للخلف</button>
      </div>
    );
  }

  const branch = branches.find(b => b.id === ticket.branchId);
  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  const canViewAll = userRole?.permissions.includes('view_all_branches');
  const canDelete = userRole?.permissions.includes('delete_reports');
  const canManage = userRole?.permissions.includes('manage_tickets');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addTicketComment(ticket.id, {
      text: commentText,
      date: new Date().toISOString(),
      authorId: currentUser!.id
    });
    
    setCommentText('');
  };

  const statusMap = {
    open: { label: 'مفتوح', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    closed: { label: 'مغلق', color: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400' },
  };

  const urgencyMap = {
    low: { label: 'منخفضة', color: 'text-blue-500' },
    medium: { label: 'متوسطة', color: 'text-orange-500' },
    high: { label: 'عالية', color: 'text-red-500' },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12" dir="rtl">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold"
        >
          <ArrowRight size={20} />
          <span>العودة للطلبات</span>
        </button>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <select
              value={ticket.status}
              onChange={(e) => updateTicketStatus(ticket.id, e.target.value as Ticket['status'])}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            >
              <option value="open">مفتوح</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="resolved">تم الحل</option>
              <option value="closed">مغلق</option>
            </select>
          )}
          {canDelete && (
            <button 
              onClick={() => {
                if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                  deleteTicket(ticket.id);
                  navigate(-1);
                }
              }} 
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2.5 rounded-xl transition-colors"
            >
              <Trash2 size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Comments */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusMap[ticket.status].color}`}>
                {statusMap[ticket.status].label}
              </span>
              <span className="text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                #{ticket.id.toUpperCase()}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                {ticket.type === 'maintenance' ? 'طلب صيانة' : 'طلب شراء'}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">{ticket.title}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-gray-400 block">الفرع</span>
                <span className="font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" />
                  {branch?.name}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 block">تاريخ الطلب</span>
                <span className="font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" />
                  {ticket.date}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 block">بواسطة</span>
                <span className="font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <UserIcon size={16} className="text-indigo-500" />
                  {users.find(u => u.id === ticket.createdBy)?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Type Specific Details */}
          {ticket.type === 'maintenance' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-indigo-500" />
                معلومات الصيانة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 block mb-1">اسم المعدة / الجهاز</span>
                  <span className="font-bold text-gray-900 dark:text-white">{ticket.equipmentName || 'غير محدد'}</span>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 block mb-1">الأولوية</span>
                  <span className={`font-bold ${ticket.urgency ? urgencyMap[ticket.urgency].color : 'text-gray-500'}`}>
                    {ticket.urgency ? urgencyMap[ticket.urgency].label : 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {ticket.type === 'purchase' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Package size={20} className="text-indigo-500" />
                قائمة المشتريات
              </h3>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500">الصنف</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500">الكمية</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500">الوحدة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {ticket.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{item.unit}</td>
                        </tr>
                      ))}
                      {!ticket.items?.length && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">لا توجد أصناف محددة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {ticket.estimatedCost && (
                  <div className="flex justify-end pt-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 rounded-2xl">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 block mb-1">التكلفة التقديرية</span>
                      <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">{ticket.estimatedCost.toLocaleString()} ريال</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">وصف الطلب</h3>
            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">{ticket.description}</p>
          </div>

          {/* Images Card */}
          {(ticket.images || []).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6">المرفقات</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ticket.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noreferrer" className="block aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:opacity-90 transition-all hover:scale-[1.02] shadow-sm">
                    <img src={img} alt={`مرفق ${i+1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-indigo-500" />
                المناقشة والمتابعة
              </h3>
            </div>
            
            <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
              {(ticket.comments || []).map(comment => {
                const author = users.find(u => u.id === comment.authorId);
                const isMe = author?.id === currentUser?.id;
                
                return (
                  <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-3xl p-5 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-2 px-2 flex items-center gap-2">
                      <span>{author?.name}</span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full" />
                      <span>{format(new Date(comment.date), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                );
              })}
              {(ticket.comments || []).length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                  <p className="text-gray-400 dark:text-slate-500 text-sm">لا توجد تعليقات حتى الآن</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="اكتب تعليقاً للمتابعة..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl px-6 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  إرسال
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline/History */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 sticky top-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <History size={20} className="text-indigo-500" />
              سجل النشاط
            </h3>
            
            <div className="relative space-y-8 before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-800">
              {(ticket.history || []).slice().reverse().map((event, idx) => {
                const author = users.find(u => u.id === event.authorId);
                
                return (
                  <div key={event.id} className="relative pr-10">
                    <div className={`absolute right-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 ${
                      event.type === 'creation' ? 'bg-green-500' :
                      event.type === 'status_change' ? 'bg-blue-500' :
                      'bg-indigo-500'
                    }`}>
                      {event.type === 'creation' && <CheckCircle2 size={12} className="text-white" />}
                      {event.type === 'status_change' && <Clock size={12} className="text-white" />}
                      {event.type === 'comment' && <MessageSquare size={12} className="text-white" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-400 dark:text-slate-500">
                        {format(new Date(event.date), 'yyyy-MM-dd HH:mm')}
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {event.type === 'creation' && 'تم إنشاء الطلب'}
                        {event.type === 'status_change' && (
                          <span>تغيير الحالة إلى <span className="text-indigo-600 dark:text-indigo-400">{statusMap[event.newStatus!].label}</span></span>
                        )}
                        {event.type === 'comment' && 'إضافة تعليق جديد'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        بواسطة: {author?.name}
                      </div>
                      {event.text && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-800 line-clamp-2">
                          {event.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
