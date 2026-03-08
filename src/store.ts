import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

export const AVAILABLE_PERMISSIONS = [
  { id: 'view_all_branches', name: 'الاطلاع على كافة الفروع' },
  { id: 'manage_system', name: 'إدارة النظام (المستخدمين، الفروع، الصلاحيات، الإعدادات)' },
  { id: 'add_reports', name: 'إضافة التقارير والطلبات' },
  { id: 'delete_reports', name: 'حذف التقارير' },
  { id: 'manage_tickets', name: 'إدارة التذاكر (تغيير الحالة والحذف)' },
  { id: 'approve_reports', name: 'مراجعة واعتماد التقارير' },
  { id: 'view_maintenance_only', name: 'الاطلاع على طلبات الصيانة فقط' },
  { id: 'view_inventory_only', name: 'الاطلاع على تقارير المخزون والاحتياج فقط' },
];

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  employeeId: string;
  pin: string;
  name: string;
  roleId: string;
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  branchIds: string[];
  name: string;
  unit: string;
  category: string;
}

export interface OperationalItem {
  id: string;
  name: string;
  category: string;
}

export interface ShiftRevenue {
  id: string;
  cash: number;
  pos: number;
  delivery: number;
  employeeName: string;
}

export interface RevenueReport {
  id: string;
  referenceNumber: string;
  branchId: string;
  date: string;
  shifts: ShiftRevenue[];
  createdBy: string;
  createdAt: string;
  images?: string[];
  status: 'draft' | 'approved' | 'rejected' | 'pending';
}

export interface InventoryReportItem {
  itemId: string;
  opening: number;
  received: number;
  waste: number;
  closing: number;
  need: number;
  consumption: number;
}

export interface InventoryReport {
  id: string;
  referenceNumber: string;
  branchId: string;
  date: string;
  items: InventoryReportItem[];
  createdBy: string;
  createdAt: string;
  images?: string[];
  status: 'draft' | 'approved' | 'rejected' | 'pending';
}

export interface InspectionReportItem {
  itemId: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
}

export interface InspectionReport {
  id: string;
  referenceNumber: string;
  branchId: string;
  date: string;
  items: InspectionReportItem[];
  createdBy: string;
  createdAt: string;
  images?: string[];
}

export interface ScheduledReadingItem {
  id: string;
  name: string;
  unit?: string; // e.g., '°C' or empty for checkbox
  type: 'number' | 'boolean';
  scheduledTime: string; // HH:mm
  category: string;
}

export interface ReadingRecord {
  id: string;
  referenceNumber: string;
  branchId: string;
  itemId: string;
  value: string | number | boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (actual recording time)
  recordedBy: string;
  createdAt: string;
  image?: string;
}

export interface TicketComment {
  id: string;
  text: string;
  date: string;
  authorId: string;
}

export interface TicketHistory {
  id: string;
  type: 'status_change' | 'comment' | 'creation';
  date: string;
  authorId: string;
  oldStatus?: Ticket['status'];
  newStatus?: Ticket['status'];
  text?: string;
}

export interface Ticket {
  id: string;
  referenceNumber: string;
  branchId: string;
  date: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  comments: TicketComment[];
  history: TicketHistory[];
  images: string[];
  createdBy: string;
  type: 'maintenance' | 'purchase';
  // Maintenance specific
  equipmentName?: string;
  urgency?: 'low' | 'medium' | 'high';
  // Purchase specific
  items?: { name: string; quantity: number; unit: string }[];
  estimatedCost?: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  users: User[];
  customRoles: CustomRole[];
  branches: Branch[];
  inventoryItems: InventoryItem[];
  operationalItems: OperationalItem[];
  revenueReports: RevenueReport[];
  inventoryReports: InventoryReport[];
  inspectionReports: InspectionReport[];
  scheduledReadingItems: ScheduledReadingItem[];
  readingRecords: ReadingRecord[];
  tickets: Ticket[];
  revenueDrafts: RevenueReport[];
  currentUser: User | null;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  
  // Actions
  login: (employeeId: string, pin: string) => boolean;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  
  // Admin Actions
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addCustomRole: (role: Omit<CustomRole, 'id'>) => void;
  updateCustomRole: (id: string, role: Partial<CustomRole>) => void;
  deleteCustomRole: (id: string) => void;
  
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, branch: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  copyInventoryItems: (fromBranchId: string, toBranchId: string) => void;
  
  addOperationalItem: (item: Omit<OperationalItem, 'id'>) => void;
  updateOperationalItem: (id: string, item: Partial<OperationalItem>) => void;
  deleteOperationalItem: (id: string) => void;
  
  // User Actions
  changeUserPin: (id: string, newPin: string) => void;
  addRevenueReport: (report: Omit<RevenueReport, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  updateRevenueReportStatus: (id: string, status: 'draft' | 'approved' | 'rejected' | 'pending') => void;
  deleteRevenueReport: (id: string) => void;
  saveRevenueDraft: (report: Omit<RevenueReport, 'id' | 'referenceNumber'>) => void;
  deleteRevenueDraft: (branchId: string, date: string) => void;
  
  addInventoryReport: (report: Omit<InventoryReport, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  updateInventoryReportStatus: (id: string, status: 'draft' | 'approved' | 'rejected' | 'pending') => void;
  deleteInventoryReport: (id: string) => void;
  
  addInspectionReport: (report: Omit<InspectionReport, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  deleteInspectionReport: (id: string) => void;

  addScheduledReadingItem: (item: Omit<ScheduledReadingItem, 'id'>) => void;
  updateScheduledReadingItem: (id: string, item: Partial<ScheduledReadingItem>) => void;
  deleteScheduledReadingItem: (id: string) => void;

  addReadingRecord: (record: Omit<ReadingRecord, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  deleteReadingRecord: (id: string) => void;
  
  addTicket: (ticket: Omit<Ticket, 'id' | 'history' | 'referenceNumber'>) => void;
  updateTicketStatus: (id: string, status: Ticket['status']) => void;
  addTicketComment: (ticketId: string, comment: Omit<TicketComment, 'id'>) => void;
  deleteTicket: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const generateReferenceNumber = (dateStr: string, index: number) => {
  const datePart = dateStr.replace(/-/g, '');
  const sequencePart = (index + 1).toString().padStart(4, '0');
  return `${datePart}${sequencePart}`;
};

const initialRoles: CustomRole[] = [
  { id: 'r1', name: 'مدير نظام', permissions: ['view_all_branches', 'manage_system', 'add_reports', 'delete_reports', 'manage_tickets'] },
  { id: 'r2', name: 'مدير منطقة', permissions: ['view_all_branches', 'add_reports'] },
  { id: 'r3', name: 'موظف فرع', permissions: ['add_reports'] },
  { id: 'r4', name: 'مسؤول صيانة', permissions: ['view_maintenance_only'] },
  { id: 'r5', name: 'مسؤول مستودع', permissions: ['view_inventory_only', 'view_all_branches'] },
];

const initialUsers: User[] = [
  { id: '1', employeeId: 'admin', pin: 'admin', name: 'مدير النظام', roleId: 'r1' },
  { id: '2', employeeId: '1001', pin: '1234', name: 'أحمد (مدير منطقة)', roleId: 'r2' },
  { id: '3', employeeId: '2001', pin: '1234', name: 'محمد (فرع الرياض)', roleId: 'r3', branchId: 'b1' },
];

const initialBranches: Branch[] = [
  { id: 'b1', name: 'فرع الرياض - العليا' },
  { id: 'b2', name: 'فرع الرياض - النخيل' },
  { id: 'b3', name: 'فرع جدة - التحلية' },
  { id: 'b4', name: 'فرع الدمام - الكورنيش' },
];

const initialInventoryItems: InventoryItem[] = [
  { id: 'i1', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'دجاج طازج', unit: 'كجم', category: 'بروتين' },
  { id: 'i2', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'أرز بسمتي', unit: 'كجم', category: 'مواد جافة' },
  { id: 'i3', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'زيت قلي', unit: 'لتر', category: 'زيوت' },
  { id: 'i4', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'بطاطس مقلية', unit: 'كجم', category: 'مجمدات' },
  { id: 'i5', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'خبز برجر', unit: 'حبة', category: 'مخبوزات' },
  { id: 'i6', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'خس', unit: 'كجم', category: 'خضروات' },
  { id: 'i7', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'طماطم', unit: 'كجم', category: 'خضروات' },
  { id: 'i8', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'مايونيز', unit: 'جالون', category: 'صوصات' },
  { id: 'i9', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'كاتشب', unit: 'جالون', category: 'صوصات' },
  { id: 'i10', branchIds: ['b1', 'b2', 'b3', 'b4'], name: 'أكواب ورقية', unit: 'شدة', category: 'تغليف' },
];

const initialOperationalItems: OperationalItem[] = [
  { id: 'o1', name: 'نظافة الصالة والطاولات', category: 'النظافة' },
  { id: 'o2', name: 'نظافة الحمامات', category: 'النظافة' },
  { id: 'o3', name: 'نظافة المطبخ والأرضيات', category: 'النظافة' },
  { id: 'o4', name: 'تواريخ صلاحية اللحوم والدواجن', category: 'المخزون' },
  { id: 'o5', name: 'تواريخ صلاحية الخضروات', category: 'المخزون' },
  { id: 'o6', name: 'درجة حرارة الثلاجات (0-5)', category: 'المعدات' },
  { id: 'o7', name: 'درجة حرارة الفريزر (-18)', category: 'المعدات' },
  { id: 'o8', name: 'عمل ماكينة الكاشير والشبكة', category: 'المعدات' },
  { id: 'o9', name: 'التزام الموظفين بالزي الرسمي', category: 'الموظفين' },
  { id: 'o10', name: 'سرعة تقديم الطلبات', category: 'الجودة' },
];

const initialScheduledReadingItems: ScheduledReadingItem[] = [
  { id: 'sr1', name: 'درجة حرارة ثلاجة اللحوم', unit: '°C', type: 'number', scheduledTime: '09:00', category: 'المعدات' },
  { id: 'sr2', name: 'درجة حرارة ثلاجة اللحوم', unit: '°C', type: 'number', scheduledTime: '15:00', category: 'المعدات' },
  { id: 'sr3', name: 'درجة حرارة ثلاجة اللحوم', unit: '°C', type: 'number', scheduledTime: '21:00', category: 'المعدات' },
  { id: 'sr4', name: 'فحص نظافة منطقة التحضير', type: 'boolean', scheduledTime: '10:00', category: 'النظافة' },
  { id: 'sr5', name: 'فحص نظافة منطقة التحضير', type: 'boolean', scheduledTime: '16:00', category: 'النظافة' },
  { id: 'sr6', name: 'فحص نظافة منطقة التحضير', type: 'boolean', scheduledTime: '22:00', category: 'النظافة' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      customRoles: initialRoles,
      branches: initialBranches,
      inventoryItems: initialInventoryItems,
      operationalItems: initialOperationalItems,
      revenueReports: [],
      inventoryReports: [],
      inspectionReports: [],
      scheduledReadingItems: initialScheduledReadingItems,
      readingRecords: [],
      tickets: [],
      revenueDrafts: [],
      currentUser: null,
      theme: 'system',
      notifications: [],

      login: (employeeId, pin) => {
        const user = get().users.find(u => u.employeeId === employeeId && u.pin === pin);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),
      setTheme: (theme) => set({ theme }),
      addNotification: (message, type) => {
        const id = generateId();
        set((state) => ({ notifications: [...state.notifications, { id, message, type }] }));
        setTimeout(() => {
          set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
        }, 3000);
      },
      removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),

      addUser: (user) => {
        set((state) => ({ users: [...state.users, { ...user, id: generateId() }] }));
        get().addNotification('تم إضافة المستخدم بنجاح', 'success');
      },
      updateUser: (id, user) => {
        set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, ...user } : u) }));
        get().addNotification('تم تحديث بيانات المستخدم', 'success');
      },
      deleteUser: (id) => {
        set((state) => ({ users: state.users.filter(u => u.id !== id) }));
        get().addNotification('تم حذف المستخدم', 'success');
      },

      addCustomRole: (role) => {
        set((state) => ({ customRoles: [...state.customRoles, { ...role, id: generateId() }] }));
        get().addNotification('تم إضافة الدور بنجاح', 'success');
      },
      updateCustomRole: (id, role) => {
        set((state) => ({ customRoles: state.customRoles.map(r => r.id === id ? { ...r, ...role } : r) }));
        get().addNotification('تم تحديث الدور', 'success');
      },
      deleteCustomRole: (id) => {
        set((state) => ({ customRoles: state.customRoles.filter(r => r.id !== id) }));
        get().addNotification('تم حذف الدور', 'success');
      },

      addBranch: (branch) => {
        set((state) => ({ branches: [...state.branches, { ...branch, id: generateId() }] }));
        get().addNotification('تم إضافة الفرع بنجاح', 'success');
      },
      updateBranch: (id, branch) => {
        set((state) => ({ branches: state.branches.map(b => b.id === id ? { ...b, ...branch } : b) }));
        get().addNotification('تم تحديث بيانات الفرع', 'success');
      },
      deleteBranch: (id) => {
        set((state) => ({ branches: state.branches.filter(b => b.id !== id) }));
        get().addNotification('تم حذف الفرع', 'success');
      },

      addInventoryItem: (item) => {
        set((state) => ({ inventoryItems: [...state.inventoryItems, { ...item, id: generateId() }] }));
        get().addNotification('تم إضافة الصنف بنجاح', 'success');
      },
      updateInventoryItem: (id, item) => {
        set((state) => ({ inventoryItems: state.inventoryItems.map(i => i.id === id ? { ...i, ...item } : i) }));
        get().addNotification('تم تحديث الصنف', 'success');
      },
      deleteInventoryItem: (id) => {
        set((state) => ({ inventoryItems: state.inventoryItems.filter(i => i.id !== id) }));
        get().addNotification('تم حذف الصنف', 'success');
      },
      copyInventoryItems: (fromBranchId, toBranchId) => {
        set((state) => {
          const fromItems = state.inventoryItems.filter(item => item.branchIds.includes(fromBranchId));
          const newItems = [...state.inventoryItems];
          
          fromItems.forEach(item => {
            const existingItemIndex = newItems.findIndex(ni => ni.name === item.name && ni.unit === item.unit);
            if (existingItemIndex !== -1) {
              const existingItem = newItems[existingItemIndex];
              if (!existingItem.branchIds.includes(toBranchId)) {
                newItems[existingItemIndex] = {
                  ...existingItem,
                  branchIds: [...existingItem.branchIds, toBranchId]
                };
              }
            } else {
              newItems.push({
                ...item,
                id: generateId(),
                branchIds: [toBranchId]
              });
            }
          });
          
          return { inventoryItems: newItems };
        });
        get().addNotification('تم نسخ الأصناف بنجاح', 'success');
      },

      addOperationalItem: (item) => {
        set((state) => ({ operationalItems: [...state.operationalItems, { ...item, id: generateId() }] }));
        get().addNotification('تم إضافة بند التشغيل بنجاح', 'success');
      },
      updateOperationalItem: (id, item) => {
        set((state) => ({ operationalItems: state.operationalItems.map(i => i.id === id ? { ...i, ...item } : i) }));
        get().addNotification('تم تحديث بند التشغيل', 'success');
      },
      deleteOperationalItem: (id) => {
        set((state) => ({ operationalItems: state.operationalItems.filter(i => i.id !== id) }));
        get().addNotification('تم حذف بند التشغيل', 'success');
      },

      changeUserPin: (id, newPin) => {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, pin: newPin } : u),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, pin: newPin } : state.currentUser
        }));
        get().addNotification('تم تغيير كلمة المرور بنجاح', 'success');
      },

      addRevenueReport: (report) => {
        set((state) => {
          const count = state.revenueReports.filter(r => r.date === report.date).length;
          const referenceNumber = generateReferenceNumber(report.date, count);
          return {  
            revenueReports: [...state.revenueReports, { 
              ...report, 
              id: generateId(), 
              createdAt: new Date().toISOString(),
              referenceNumber,
              status: report.status || 'pending'
            }],
            revenueDrafts: state.revenueDrafts.filter(d => !(d.branchId === report.branchId && d.date === report.date))
          };
        });
        get().addNotification('تم إضافة تقرير الإيرادات بنجاح', 'success');
      },
      updateRevenueReportStatus: (id, status) => {
        set((state) => ({
          revenueReports: state.revenueReports.map(r => r.id === id ? { ...r, status } : r)
        }));
        get().addNotification(`تم تغيير حالة التقرير إلى ${status === 'approved' ? 'مقبول' : 'مرفوض'}`, 'success');
      },
      deleteRevenueReport: (id) => {
        set((state) => ({ revenueReports: state.revenueReports.filter(r => r.id !== id) }));
        get().addNotification('تم حذف التقرير', 'success');
      },
      saveRevenueDraft: (report) => {
        set((state) => {
          const existingIndex = state.revenueDrafts.findIndex(d => d.branchId === report.branchId && d.date === report.date);
          const newDrafts = [...state.revenueDrafts];
          if (existingIndex !== -1) {
            newDrafts[existingIndex] = { ...report, id: state.revenueDrafts[existingIndex].id, referenceNumber: '', createdAt: '', status: 'draft' };
          } else {
            newDrafts.push({ ...report, id: generateId(), referenceNumber: '', createdAt: '', status: 'draft' });
          }
          return { revenueDrafts: newDrafts };
        });
        get().addNotification('تم حفظ المسودة', 'success');
      },
      deleteRevenueDraft: (branchId, date) => set((state) => ({
        revenueDrafts: state.revenueDrafts.filter(d => !(d.branchId === branchId && d.date === date))
      })),

      addInventoryReport: (report) => {
        set((state) => {
          const count = state.inventoryReports.filter(r => r.date === report.date).length;
          const referenceNumber = generateReferenceNumber(report.date, count);
          return { 
            inventoryReports: [...state.inventoryReports, { 
              ...report, 
              id: generateId(), 
              createdAt: new Date().toISOString(),
              referenceNumber,
              status: report.status || 'pending'
            }] 
          };
        });
        get().addNotification('تم إضافة تقرير الجرد بنجاح', 'success');
      },
      updateInventoryReportStatus: (id, status) => {
        set((state) => ({
          inventoryReports: state.inventoryReports.map(r => r.id === id ? { ...r, status } : r)
        }));
        get().addNotification(`تم تغيير حالة التقرير إلى ${status === 'approved' ? 'مقبول' : 'مرفوض'}`, 'success');
      },
      deleteInventoryReport: (id) => {
        set((state) => ({ inventoryReports: state.inventoryReports.filter(r => r.id !== id) }));
        get().addNotification('تم حذف التقرير', 'success');
      },

      addInspectionReport: (report) => {
        set((state) => {
          const count = state.inspectionReports.filter(r => r.date === report.date).length;
          const referenceNumber = generateReferenceNumber(report.date, count);
          return { 
            inspectionReports: [...state.inspectionReports, { 
              ...report, 
              id: generateId(), 
              createdAt: new Date().toISOString(),
              referenceNumber
            }] 
          };
        });
        get().addNotification('تم إضافة تقرير التشغيل بنجاح', 'success');
      },
      deleteInspectionReport: (id) => {
        set((state) => ({ inspectionReports: state.inspectionReports.filter(r => r.id !== id) }));
        get().addNotification('تم حذف التقرير', 'success');
      },

      addScheduledReadingItem: (item) => {
        set((state) => ({ scheduledReadingItems: [...state.scheduledReadingItems, { ...item, id: generateId() }] }));
        get().addNotification('تم إضافة العنصر المجدول', 'success');
      },
      updateScheduledReadingItem: (id, item) => {
        set((state) => ({ scheduledReadingItems: state.scheduledReadingItems.map(i => i.id === id ? { ...i, ...item } : i) }));
        get().addNotification('تم تحديث العنصر', 'success');
      },
      deleteScheduledReadingItem: (id) => {
        set((state) => ({ scheduledReadingItems: state.scheduledReadingItems.filter(i => i.id !== id) }));
        get().addNotification('تم حذف العنصر', 'success');
      },

      addReadingRecord: (record) => {
        set((state) => {
          const count = state.readingRecords.filter(r => r.date === record.date).length;
          const referenceNumber = generateReferenceNumber(record.date, count);
          return { 
            readingRecords: [...state.readingRecords, { 
              ...record, 
              id: generateId(), 
              createdAt: new Date().toISOString(),
              referenceNumber
            }] 
          };
        });
        get().addNotification('تم تسجيل القراءة بنجاح', 'success');
      },
      deleteReadingRecord: (id) => {
        set((state) => ({ readingRecords: state.readingRecords.filter(r => r.id !== id) }));
        get().addNotification('تم حذف القراءة', 'success');
      },

      addTicket: (ticket) => {
        set((state) => {
          const id = generateId();
          const count = state.tickets.filter(t => t.date === ticket.date).length;
          const referenceNumber = generateReferenceNumber(ticket.date, count);
          
          const historyEntry: TicketHistory = {
            id: generateId(),
            type: 'creation',
            date: new Date().toISOString(),
            authorId: state.currentUser!.id,
          };
          return { 
            tickets: [...state.tickets, { ...ticket, id, history: [historyEntry], referenceNumber }] 
          };
        });
        get().addNotification('تم إنشاء التذكرة بنجاح', 'success');
      },
      updateTicketStatus: (id, status) => {
        set((state) => ({ 
          tickets: state.tickets.map(t => {
            if (t.id === id) {
              const historyEntry: TicketHistory = {
                id: generateId(),
                type: 'status_change',
                date: new Date().toISOString(),
                authorId: state.currentUser!.id,
                oldStatus: t.status,
                newStatus: status
              };
              return { ...t, status, history: [...(t.history || []), historyEntry] };
            }
            return t;
          }) 
        }));
        get().addNotification('تم تحديث حالة التذكرة', 'success');
      },
      addTicketComment: (ticketId, comment) => {
        set((state) => ({
          tickets: state.tickets.map(t => {
            if (t.id === ticketId) {
              const historyEntry: TicketHistory = {
                id: generateId(),
                type: 'comment',
                date: new Date().toISOString(),
                authorId: state.currentUser!.id,
                text: comment.text
              };
              return { 
                ...t, 
                comments: [...(t.comments || []), { ...comment, id: generateId() }],
                history: [...(t.history || []), historyEntry]
              };
            }
            return t;
          })
        }));
        get().addNotification('تم إضافة التعليق', 'success');
      },
      deleteTicket: (id) => {
        set((state) => ({ tickets: state.tickets.filter(t => t.id !== id) }));
        get().addNotification('تم حذف التذكرة', 'success');
      },
    }),
    {
      name: 'restaurant-system-storage',
    }
  )
);
