import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

const firebaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const docRef = doc(db, 'store_data', name);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return JSON.stringify(docSnap.data().data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get state from Firebase', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const docRef = doc(db, 'store_data', name);
      await setDoc(docRef, { data: JSON.parse(value) });
    } catch (error) {
      console.error('Failed to save state to Firebase', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const docRef = doc(db, 'store_data', name);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to delete state from Firebase', error);
    }
  },
};

export const AVAILABLE_PERMISSIONS = [
  { id: 'view_all_branches', name: 'الاطلاع على كافة الفروع' },
  { id: 'manage_system', name: 'إدارة النظام (المستخدمين، الفروع، الصلاحيات، الإعدادات)' },
  
  // Revenue Permissions
  { id: 'view_revenue', name: 'عرض الإيرادات' },
  { id: 'add_revenue', name: 'إضافة إيراد' },
  { id: 'edit_revenue', name: 'تعديل إيراد' },
  { id: 'delete_revenue', name: 'حذف إيراد' },

  // Inventory Permissions
  { id: 'view_inventory', name: 'عرض المخزون' },
  { id: 'add_inventory', name: 'إضافة مخزون' },
  { id: 'edit_inventory', name: 'تعديل مخزون' },
  { id: 'delete_inventory', name: 'حذف مخزون' },

  // Scheduled Readings Permissions
  { id: 'view_scheduled', name: 'عرض القراءات المجدولة' },
  { id: 'add_scheduled', name: 'إضافة قراءة مجدولة' },
  { id: 'edit_scheduled', name: 'تعديل قراءة مجدولة' },
  { id: 'delete_scheduled', name: 'حذف قراءة مجدولة' },

  // Maintenance Permissions
  { id: 'view_maintenance', name: 'عرض طلبات الصيانة' },
  { id: 'add_maintenance', name: 'إضافة طلب صيانة' },
  { id: 'edit_maintenance', name: 'تعديل طلب صيانة' },
  { id: 'delete_maintenance', name: 'حذف طلب صيانة' },
  { id: 'approve_maintenance_cost', name: 'اعتماد تكلفة الصيانة' },

  // Purchase Permissions
  { id: 'view_purchase', name: 'عرض طلبات الشراء' },
  { id: 'add_purchase', name: 'إضافة طلب شراء' },
  { id: 'edit_purchase', name: 'تعديل طلب شراء' },
  { id: 'delete_purchase', name: 'حذف طلب شراء' },

  // Car Handovers Permissions
  { id: 'view_cars', name: 'عرض السيارات' },
  { id: 'manage_cars', name: 'إدارة السيارات' },
  { id: 'view_car_handovers', name: 'عرض عمليات استلام السيارات' },
  { id: 'add_car_handovers', name: 'إضافة عملية استلام سيارة' },

  // Legacy/Other
  { id: 'add_reports', name: 'إضافة التقارير والطلبات (عام)' },
  { id: 'delete_reports', name: 'حذف التقارير (عام)' },
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

export interface Car {
  id: string;
  name: string;
  model: string;
  plateNumber: string;
}

export interface CarHandover {
  id: string;
  referenceNumber: string;
  carId: string;
  date: string;
  driverId: string;
  odometerReading: number;
  fuelLevel: number;
  odometerImage: string;
  rightSideImage: string;
  leftSideImage: string;
  backImage: string;
  frontImage: string;
  reason: string;
  expectedReturnDate?: string;
  createdAt: string;
  status: 'open' | 'closed';
  returnDate?: string;
  returnOdometerReading?: number;
  returnFuelLevel?: number;
  returnOdometerImage?: string;
  returnRightSideImage?: string;
  returnLeftSideImage?: string;
  returnBackImage?: string;
  returnFrontImage?: string;
  returnReason?: string;
  notes?: string;
  returnNotes?: string;
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
  image?: string;
}

export interface TicketHistory {
  id: string;
  type: 'status_change' | 'comment' | 'creation' | 'cost_added' | 'cost_approved';
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
  cost?: number;
  costAddedAt?: string;
  isCostApproved?: boolean;
  costApprovedBy?: string;
  costApprovedAt?: string;
  // Purchase specific
  items?: { name: string; quantity: number; unit: string }[];
  estimatedCost?: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  undoAction?: () => void;
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
  cars: Car[];
  carHandovers: CarHandover[];
  currentUser: User | null;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  isDbConnected: boolean | null;
  
  // Actions
  checkDbConnection: () => Promise<void>;
  login: (employeeId: string, pin: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info', duration?: number, undoAction?: () => void) => void;
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

  addCar: (car: Omit<Car, 'id'>) => void;
  updateCar: (id: string, car: Partial<Car>) => void;
  deleteCar: (id: string) => void;
  
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
  updateRevenueReport: (id: string, updates: Partial<RevenueReport>) => void;
  updateRevenueReportStatus: (id: string, status: 'draft' | 'approved' | 'rejected' | 'pending') => void;
  deleteRevenueReport: (id: string) => void;
  restoreRevenueReport: (report: RevenueReport) => void;
  
  addInventoryReport: (report: Omit<InventoryReport, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  updateInventoryReport: (id: string, updates: Partial<InventoryReport>) => void;
  updateInventoryReportStatus: (id: string, status: 'draft' | 'approved' | 'rejected' | 'pending') => void;
  deleteInventoryReport: (id: string) => void;
  restoreInventoryReport: (report: InventoryReport) => void;
  
  addInspectionReport: (report: Omit<InspectionReport, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  deleteInspectionReport: (id: string) => void;
  restoreInspectionReport: (report: InspectionReport) => void;

  addScheduledReadingItem: (item: Omit<ScheduledReadingItem, 'id'>) => void;
  updateScheduledReadingItem: (id: string, item: Partial<ScheduledReadingItem>) => void;
  deleteScheduledReadingItem: (id: string) => void;

  addReadingRecord: (record: Omit<ReadingRecord, 'id' | 'referenceNumber' | 'createdAt'>) => void;
  deleteReadingRecord: (id: string) => void;
  restoreReadingRecord: (record: ReadingRecord) => void;
  
  addTicket: (ticket: Omit<Ticket, 'id' | 'history' | 'referenceNumber'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  updateTicketStatus: (id: string, status: Ticket['status']) => void;
  addTicketComment: (ticketId: string, comment: Omit<TicketComment, 'id'>) => void;
  deleteTicket: (id: string) => void;
  restoreTicket: (ticket: Ticket) => void;

  addCarHandover: (handover: Omit<CarHandover, 'id' | 'referenceNumber' | 'createdAt' | 'status'>) => void;
  returnCarHandover: (id: string, returnData: Partial<CarHandover>) => void;
  deleteCarHandover: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const generateReferenceNumber = (dateStr: string, index: number) => {
  const datePart = dateStr.replace(/-/g, '');
  const sequencePart = (index + 1).toString().padStart(4, '0');
  return `${datePart}${sequencePart}`;
};

const initialRoles: CustomRole[] = [
  { 
    id: 'r1', 
    name: 'مدير نظام', 
    permissions: [
      'view_all_branches', 'manage_system', 'add_reports', 'delete_reports', 'manage_tickets', 'approve_reports',
      'view_revenue', 'add_revenue', 'edit_revenue', 'delete_revenue',
      'view_inventory', 'add_inventory', 'edit_inventory', 'delete_inventory',
      'view_scheduled', 'add_scheduled', 'edit_scheduled', 'delete_scheduled',
      'view_maintenance', 'add_maintenance', 'edit_maintenance', 'delete_maintenance', 'approve_maintenance_cost',
      'view_purchase', 'add_purchase', 'edit_purchase', 'delete_purchase',
      'view_cars', 'manage_cars', 'view_car_handovers', 'add_car_handovers'
    ] 
  },
  { 
    id: 'r2', 
    name: 'مدير منطقة', 
    permissions: [
      'view_all_branches', 'approve_reports', 'approve_maintenance_cost',
      'view_revenue', 'view_inventory', 'view_scheduled', 'view_maintenance', 'view_purchase',
      'view_cars', 'view_car_handovers'
    ] 
  },
  { 
    id: 'r3', 
    name: 'مدير فرع', 
    permissions: [
      'add_reports',
      'view_revenue', 'add_revenue',
      'view_inventory', 'add_inventory',
      'view_scheduled', 'add_scheduled',
      'view_maintenance', 'add_maintenance',
      'view_purchase', 'add_purchase',
      'view_cars', 'view_car_handovers'
    ] 
  },
  { id: 'r4', name: 'مسؤول صيانة', permissions: ['view_maintenance_only', 'view_maintenance', 'add_maintenance', 'edit_maintenance'] },
  { id: 'r5', name: 'مسؤول مستودع', permissions: ['view_inventory_only', 'view_all_branches', 'view_inventory', 'add_inventory'] },
  { id: 'r6', name: 'سائق', permissions: ['view_cars', 'view_car_handovers', 'add_car_handovers'] },
];

const initialUsers: User[] = [];

const initialBranches: Branch[] = [];

const initialInventoryItems: InventoryItem[] = [];

const initialOperationalItems: OperationalItem[] = [];

const initialScheduledReadingItems: ScheduledReadingItem[] = [];

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
      cars: [],
      carHandovers: [],
      currentUser: (() => {
        try {
          const rememberMe = localStorage.getItem('restaurant_remember_me') === 'true';
          const savedUser = localStorage.getItem('restaurant_session_user');
          if (rememberMe && savedUser) {
            return JSON.parse(savedUser);
          }
        } catch (e) {
          console.error('Failed to load session', e);
        }
        return null;
      })(),
      theme: 'system',
      notifications: [],
      isDbConnected: null,

      checkDbConnection: async () => {
        try {
          // A simple query to check if Firestore is reachable
          const docRef = doc(db, 'health_check', 'ping');
          await setDoc(docRef, { timestamp: new Date().toISOString() });
          set({ isDbConnected: true });
        } catch (error) {
          console.error('Database connection check failed', error);
          set({ isDbConnected: false });
        }
      },

      login: (employeeId, pin, rememberMe) => {
        const user = get().users.find(u => u.employeeId === employeeId && u.pin === pin);
        if (user) {
          set({ currentUser: user });
          if (rememberMe) {
            localStorage.setItem('restaurant_remember_me', 'true');
            localStorage.setItem('restaurant_session_user', JSON.stringify(user));
          } else {
            localStorage.removeItem('restaurant_remember_me');
            localStorage.removeItem('restaurant_session_user');
          }
          return true;
        }
        return false;
      },
      logout: () => {
        set({ currentUser: null });
        localStorage.removeItem('restaurant_remember_me');
        localStorage.removeItem('restaurant_session_user');
      },
      setTheme: (theme) => set({ theme }),
      addNotification: (message, type, duration = 3000, undoAction) => {
        const id = generateId();
        set((state) => ({ notifications: [...state.notifications, { id, message, type, undoAction }] }));
        setTimeout(() => {
          set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
        }, duration);
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

      addCar: (car) => {
        set((state) => ({ cars: [...state.cars, { ...car, id: generateId() }] }));
        get().addNotification('تم إضافة السيارة بنجاح', 'success');
      },
      updateCar: (id, car) => {
        set((state) => ({ cars: state.cars.map(c => c.id === id ? { ...c, ...car } : c) }));
        get().addNotification('تم تحديث بيانات السيارة', 'success');
      },
      deleteCar: (id) => {
        set((state) => ({ cars: state.cars.filter(c => c.id !== id) }));
        get().addNotification('تم حذف السيارة', 'success');
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
            }]
          };
        });
        get().addNotification('تم إضافة تقرير الإيرادات بنجاح', 'success');
      },
      updateRevenueReport: (id, updates) => {
        set((state) => ({
          revenueReports: state.revenueReports.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
        get().addNotification('تم تحديث تقرير الإيرادات', 'success');
      },
      updateRevenueReportStatus: (id, status) => {
        set((state) => ({
          revenueReports: state.revenueReports.map(r => r.id === id ? { ...r, status } : r)
        }));
        get().addNotification(`تم تغيير حالة التقرير إلى ${status === 'approved' ? 'مقبول' : 'مرفوض'}`, 'success');
      },
      deleteRevenueReport: (id) => {
        set((state) => ({ revenueReports: state.revenueReports.filter(r => r.id !== id) }));
      },
      restoreRevenueReport: (report) => {
        set((state) => ({ revenueReports: [...state.revenueReports, report] }));
        get().addNotification('تم استعادة التقرير', 'success');
      },

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
      updateInventoryReport: (id, updates) => {
        set((state) => ({
          inventoryReports: state.inventoryReports.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
        get().addNotification('تم تحديث تقرير الجرد', 'success');
      },
      updateInventoryReportStatus: (id, status) => {
        set((state) => ({
          inventoryReports: state.inventoryReports.map(r => r.id === id ? { ...r, status } : r)
        }));
        get().addNotification(`تم تغيير حالة التقرير إلى ${status === 'approved' ? 'مقبول' : 'مرفوض'}`, 'success');
      },
      deleteInventoryReport: (id) => {
        set((state) => ({ inventoryReports: state.inventoryReports.filter(r => r.id !== id) }));
      },
      restoreInventoryReport: (report) => {
        set((state) => ({ inventoryReports: [...state.inventoryReports, report] }));
        get().addNotification('تم استعادة التقرير', 'success');
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
      },
      restoreInspectionReport: (report) => {
        set((state) => ({ inspectionReports: [...state.inspectionReports, report] }));
        get().addNotification('تم استعادة التقرير', 'success');
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
      },
      restoreReadingRecord: (record) => {
        set((state) => ({ readingRecords: [...state.readingRecords, record] }));
        get().addNotification('تم استعادة التقرير', 'success');
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
      updateTicket: (id, updates) => {
        set((state) => ({
          tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        get().addNotification('تم تحديث التذكرة', 'success');
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
      },
      restoreTicket: (ticket) => {
        set((state) => ({ tickets: [...state.tickets, ticket] }));
        get().addNotification('تم استعادة الطلب', 'success');
      },

      addCarHandover: (handover) => {
        set((state) => {
          const count = state.carHandovers.filter(h => h.date === handover.date).length;
          const referenceNumber = generateReferenceNumber(handover.date, count);
          return {
            carHandovers: [...state.carHandovers, {
              ...handover,
              id: generateId(),
              createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
              referenceNumber,
              status: 'open'
            }]
          };
        });
        get().addNotification('تم تسجيل استلام السيارة بنجاح', 'success');
      },
      returnCarHandover: (id, returnData) => {
        set((state) => ({
          carHandovers: state.carHandovers.map(h => 
            h.id === id ? { ...h, ...returnData, status: 'closed' } : h
          )
        }));
        get().addNotification('تم تسجيل تسليم السيارة بنجاح', 'success');
      },
      deleteCarHandover: (id) => {
        set((state) => ({ carHandovers: state.carHandovers.filter(h => h.id !== id) }));
        get().addNotification('تم حذف سجل استلام السيارة', 'success');
      },
    }),
    {
      name: 'restaurant-system-storage',
      storage: createJSONStorage(() => firebaseStorage),
      partialize: (state) => {
        // Exclude session-specific and temporary data from Firestore
        const { currentUser, notifications, isDbConnected, ...rest } = state;
        return rest;
      },
    }
  )
);
