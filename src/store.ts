import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const AVAILABLE_PERMISSIONS = [
  { id: 'view_all_branches', name: 'الاطلاع على كافة الفروع' },
  { id: 'manage_system', name: 'إدارة النظام (المستخدمين، الفروع، الصلاحيات، الإعدادات)' },
  { id: 'add_reports', name: 'إضافة التقارير والطلبات' },
  { id: 'delete_reports', name: 'حذف التقارير' },
  { id: 'manage_tickets', name: 'إدارة التذاكر (تغيير الحالة والحذف)' },
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
  branchId: string;
  date: string;
  shifts: ShiftRevenue[];
  createdBy: string;
  createdAt: string;
  images?: string[];
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
  branchId: string;
  date: string;
  items: InventoryReportItem[];
  createdBy: string;
  createdAt: string;
  images?: string[];
}

export interface InspectionReportItem {
  itemId: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
}

export interface InspectionReport {
  id: string;
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
  
  // Actions
  login: (employeeId: string, pin: string) => boolean;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
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
  addRevenueReport: (report: Omit<RevenueReport, 'id'>) => void;
  deleteRevenueReport: (id: string) => void;
  saveRevenueDraft: (report: Omit<RevenueReport, 'id'>) => void;
  deleteRevenueDraft: (branchId: string, date: string) => void;
  
  addInventoryReport: (report: Omit<InventoryReport, 'id'>) => void;
  deleteInventoryReport: (id: string) => void;
  
  addInspectionReport: (report: Omit<InspectionReport, 'id'>) => void;
  deleteInspectionReport: (id: string) => void;

  addScheduledReadingItem: (item: Omit<ScheduledReadingItem, 'id'>) => void;
  updateScheduledReadingItem: (id: string, item: Partial<ScheduledReadingItem>) => void;
  deleteScheduledReadingItem: (id: string) => void;

  addReadingRecord: (record: Omit<ReadingRecord, 'id'>) => void;
  deleteReadingRecord: (id: string) => void;
  
  addTicket: (ticket: Omit<Ticket, 'id' | 'history'>) => void;
  updateTicketStatus: (id: string, status: Ticket['status']) => void;
  addTicketComment: (ticketId: string, comment: Omit<TicketComment, 'id'>) => void;
  deleteTicket: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

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

      addUser: (user) => set((state) => ({ users: [...state.users, { ...user, id: generateId() }] })),
      updateUser: (id, user) => set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, ...user } : u) })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter(u => u.id !== id) })),

      addCustomRole: (role) => set((state) => ({ customRoles: [...state.customRoles, { ...role, id: generateId() }] })),
      updateCustomRole: (id, role) => set((state) => ({ customRoles: state.customRoles.map(r => r.id === id ? { ...r, ...role } : r) })),
      deleteCustomRole: (id) => set((state) => ({ customRoles: state.customRoles.filter(r => r.id !== id) })),

      addBranch: (branch) => set((state) => ({ branches: [...state.branches, { ...branch, id: generateId() }] })),
      updateBranch: (id, branch) => set((state) => ({ branches: state.branches.map(b => b.id === id ? { ...b, ...branch } : b) })),
      deleteBranch: (id) => set((state) => ({ branches: state.branches.filter(b => b.id !== id) })),

      addInventoryItem: (item) => set((state) => ({ inventoryItems: [...state.inventoryItems, { ...item, id: generateId() }] })),
      updateInventoryItem: (id, item) => set((state) => ({ inventoryItems: state.inventoryItems.map(i => i.id === id ? { ...i, ...item } : i) })),
      deleteInventoryItem: (id) => set((state) => ({ inventoryItems: state.inventoryItems.filter(i => i.id !== id) })),
      copyInventoryItems: (fromBranchId, toBranchId) => set((state) => {
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
      }),

      addOperationalItem: (item) => set((state) => ({ operationalItems: [...state.operationalItems, { ...item, id: generateId() }] })),
      updateOperationalItem: (id, item) => set((state) => ({ operationalItems: state.operationalItems.map(i => i.id === id ? { ...i, ...item } : i) })),
      deleteOperationalItem: (id) => set((state) => ({ operationalItems: state.operationalItems.filter(i => i.id !== id) })),

      addRevenueReport: (report) => set((state) => ({ 
        revenueReports: [...state.revenueReports, { ...report, id: generateId(), createdAt: new Date().toISOString() }],
        revenueDrafts: state.revenueDrafts.filter(d => !(d.branchId === report.branchId && d.date === report.date))
      })),
      deleteRevenueReport: (id) => set((state) => ({ revenueReports: state.revenueReports.filter(r => r.id !== id) })),
      saveRevenueDraft: (report) => set((state) => {
        const existingIndex = state.revenueDrafts.findIndex(d => d.branchId === report.branchId && d.date === report.date);
        const newDrafts = [...state.revenueDrafts];
        if (existingIndex !== -1) {
          newDrafts[existingIndex] = { ...report, id: state.revenueDrafts[existingIndex].id };
        } else {
          newDrafts.push({ ...report, id: generateId() });
        }
        return { revenueDrafts: newDrafts };
      }),
      deleteRevenueDraft: (branchId, date) => set((state) => ({
        revenueDrafts: state.revenueDrafts.filter(d => !(d.branchId === branchId && d.date === date))
      })),

      addInventoryReport: (report) => set((state) => ({ inventoryReports: [...state.inventoryReports, { ...report, id: generateId(), createdAt: new Date().toISOString() }] })),
      deleteInventoryReport: (id) => set((state) => ({ inventoryReports: state.inventoryReports.filter(r => r.id !== id) })),

      addInspectionReport: (report) => set((state) => ({ inspectionReports: [...state.inspectionReports, { ...report, id: generateId(), createdAt: new Date().toISOString() }] })),
      deleteInspectionReport: (id) => set((state) => ({ inspectionReports: state.inspectionReports.filter(r => r.id !== id) })),

      addScheduledReadingItem: (item) => set((state) => ({ scheduledReadingItems: [...state.scheduledReadingItems, { ...item, id: generateId() }] })),
      updateScheduledReadingItem: (id, item) => set((state) => ({ scheduledReadingItems: state.scheduledReadingItems.map(i => i.id === id ? { ...i, ...item } : i) })),
      deleteScheduledReadingItem: (id) => set((state) => ({ scheduledReadingItems: state.scheduledReadingItems.filter(i => i.id !== id) })),

      addReadingRecord: (record) => set((state) => ({ readingRecords: [...state.readingRecords, { ...record, id: generateId(), createdAt: new Date().toISOString() }] })),
      deleteReadingRecord: (id) => set((state) => ({ readingRecords: state.readingRecords.filter(r => r.id !== id) })),

      addTicket: (ticket) => set((state) => {
        const id = generateId();
        const historyEntry: TicketHistory = {
          id: generateId(),
          type: 'creation',
          date: new Date().toISOString(),
          authorId: state.currentUser!.id,
        };
        return { 
          tickets: [...state.tickets, { ...ticket, id, history: [historyEntry] }] 
        };
      }),
      updateTicketStatus: (id, status) => set((state) => ({ 
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
      })),
      addTicketComment: (ticketId, comment) => set((state) => ({
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
      })),
      deleteTicket: (id) => set((state) => ({ tickets: state.tickets.filter(t => t.id !== id) })),
    }),
    {
      name: 'restaurant-system-storage',
    }
  )
);
