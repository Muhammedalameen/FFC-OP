import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  Query
} from 'firebase/firestore';
import { format } from 'date-fns';

export interface User {
  id: string;
  employeeId: string;
  pin: string;
  name: string;
  roleId: string;
  branchId?: string;
  sessionId?: string;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

export interface Car {
  id: string;
  name: string;
  licensePlate: string;
  branchId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  branchId: string;
  date: string;
}

export interface RevenueReport {
  id: string;
  branchId: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface InventoryReport {
  id: string;
  branchId: string;
  date: string;
  items: any[];
  createdAt: string;
}

export interface InspectionReport {
  id: string;
  branchId: string;
  date: string;
  findings: string;
  createdAt: string;
}

export interface ScheduledReadingItem {
  id: string;
  name: string;
  frequency: string;
}

export interface ReadingRecord {
  id: string;
  scheduledReadingId: string;
  branchId: string;
  date: string;
  value: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  branchId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  date: string;
  createdAt: string;
}

export interface CarHandover {
  id: string;
  carId: string;
  branchId: string;
  fromUser: string;
  toUser: string;
  date: string;
  mileage: number;
  createdAt: string;
}

export interface AppState {
  // Collections
  users: User[];
  customRoles: CustomRole[];
  branches: Branch[];
  cars: Car[];
  inventoryItems: InventoryItem[];
  operationalItems: any[];
  revenueReports: RevenueReport[];
  inventoryReports: InventoryReport[];
  inspectionReports: InspectionReport[];
  scheduledReadingItems: ScheduledReadingItem[];
  readingRecords: ReadingRecord[];
  tickets: Ticket[];
  carHandovers: CarHandover[];

  // State
  currentUser: User | null;
  currentSessionId: string;
  isLoading: boolean;
  syncStatus: Record<string, 'pending' | 'syncing' | 'success' | 'error'>;
  syncErrorMessages: Record<string, string>;
  syncProgress: { current: number; total: number } | null;
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

  // Actions
  setIsLoading: (loading: boolean) => void;
  setSyncStatus: (collection: string, status: 'pending' | 'syncing' | 'success' | 'error', errorMessage?: string) => void;
  setSyncProgress: (progress: { current: number; total: number } | null) => void;
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;

  // User actions
  login: (user: User, sessionId: string) => void;
  logout: () => void;
  updateCurrentUser: (user: User) => void;

  // CRUD operations
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  addRevenueReport: (report: RevenueReport) => Promise<void>;
  updateRevenueReport: (report: RevenueReport) => Promise<void>;
  deleteRevenueReport: (reportId: string) => Promise<void>;

  addInventoryReport: (report: InventoryReport) => Promise<void>;
  updateInventoryReport: (report: InventoryReport) => Promise<void>;
  deleteInventoryReport: (reportId: string) => Promise<void>;

  addInspectionReport: (report: InspectionReport) => Promise<void>;
  updateInspectionReport: (report: InspectionReport) => Promise<void>;
  deleteInspectionReport: (reportId: string) => Promise<void>;

  addTicket: (ticket: Ticket) => Promise<void>;
  updateTicket: (ticket: Ticket) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;

  addCarHandover: (handover: CarHandover) => Promise<void>;
  updateCarHandover: (handover: CarHandover) => Promise<void>;
  deleteCarHandover: (handoverId: string) => Promise<void>;

  addReadingRecord: (record: ReadingRecord) => Promise<void>;
  updateReadingRecord: (record: ReadingRecord) => Promise<void>;
  deleteReadingRecord: (recordId: string) => Promise<void>;

  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;

  addBranch: (branch: Branch) => Promise<void>;
  updateBranch: (branch: Branch) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;

  addCar: (car: Car) => Promise<void>;
  updateCar: (car: Car) => Promise<void>;
  deleteCar: (carId: string) => Promise<void>;

  addCustomRole: (role: CustomRole) => Promise<void>;
  updateCustomRole: (role: CustomRole) => Promise<void>;
  deleteCustomRole: (roleId: string) => Promise<void>;

  addScheduledReadingItem: (item: ScheduledReadingItem) => Promise<void>;
  updateScheduledReadingItem: (item: ScheduledReadingItem) => Promise<void>;
  deleteScheduledReadingItem: (itemId: string) => Promise<void>;
}

const COLLECTIONS_TO_SYNC = [
  'users', 'customRoles', 'branches', 'cars', 'inventoryItems',
  'operationalItems', 'revenueReports', 'inventoryReports',
  'inspectionReports', 'scheduledReadingItems', 'readingRecords',
  'tickets', 'carHandovers'
];

export const GLOBAL_COLLECTIONS = ['users', 'customRoles', 'branches'];

export const AVAILABLE_PERMISSIONS = [
  { id: 'view_all_branches', name: 'الاطلاع على كافة الفروع', category: 'عام' },
  { id: 'manage_system', name: 'إدارة النظام', category: 'عام' },
  { id: 'view_revenue', name: 'عرض الإيرادات', category: 'الإيرادات' },
  { id: 'add_revenue', name: 'إضافة إيراد', category: 'الإيرادات' },
  { id: 'edit_revenue', name: 'تعديل إيراد', category: 'الإيرادات' },
  { id: 'delete_revenue', name: 'حذف إيراد', category: 'الإيرادات' },
  { id: 'view_inventory', name: 'عرض المخزون', category: 'المخزون' },
  { id: 'add_inventory', name: 'إضافة مخزون', category: 'المخزون' },
  { id: 'edit_inventory', name: 'تعديل مخزون', category: 'المخزون' },
  { id: 'delete_inventory', name: 'حذف مخزون', category: 'المخزون' },
  { id: 'view_scheduled', name: 'عرض القراءات المجدولة', category: 'القراءات المجدولة' },
  { id: 'add_scheduled', name: 'إضافة قراءة مجدولة', category: 'القراءات المجدولة' },
  { id: 'edit_scheduled', name: 'تعديل قراءة مجدولة', category: 'القراءات المجدولة' },
  { id: 'delete_scheduled', name: 'حذف قراءة مجدولة', category: 'القراءات المجدولة' },
  { id: 'view_maintenance', name: 'عرض طلبات الصيانة', category: 'الصيانة' },
  { id: 'add_maintenance', name: 'إضافة طلب صيانة', category: 'الصيانة' },
  { id: 'edit_maintenance', name: 'تعديل طلب صيانة', category: 'الصيانة' },
  { id: 'delete_maintenance', name: 'حذف طلب صيانة', category: 'الصيانة' },
  { id: 'approve_maintenance_cost', name: 'الموافقة على تكاليف الصيانة', category: 'الصيانة' },
  { id: 'view_purchase', name: 'عرض المشتريات', category: 'المشتريات' },
  { id: 'add_purchase', name: 'إضافة مشتريات', category: 'المشتريات' },
  { id: 'edit_purchase', name: 'تعديل مشتريات', category: 'المشتريات' },
  { id: 'delete_purchase', name: 'حذف مشتريات', category: 'المشتريات' },
  { id: 'view_cars', name: 'عرض السيارات', category: 'السيارات' },
  { id: 'manage_cars', name: 'إدارة السيارات', category: 'السيارات' },
  { id: 'view_car_handovers', name: 'عرض تسليمات السيارات', category: 'السيارات' },
  { id: 'add_car_handovers', name: 'إضافة تسليم سيارة', category: 'السيارات' },
  { id: 'approve_reports', name: 'الموافقة على التقارير', category: 'عام' },
];

let firestoreUnsubscribers: Unsubscribe[] = [];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Collections
      users: [],
      customRoles: [],
      branches: [],
      cars: [],
      inventoryItems: [],
      operationalItems: [],
      revenueReports: [],
      inventoryReports: [],
      inspectionReports: [],
      scheduledReadingItems: [],
      readingRecords: [],
      tickets: [],
      carHandovers: [],

      // State
      currentUser: null,
      currentSessionId: '',
      isLoading: false,
      syncStatus: {},
      syncErrorMessages: {},
      syncProgress: null,
      notifications: [],

      // State setters
      setIsLoading: (loading) => set({ isLoading: loading }),
      setSyncStatus: (collection, status, errorMessage) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, [collection]: status },
          syncErrorMessages: { ...state.syncErrorMessages, [collection]: errorMessage || '' }
        }));
      },
      setSyncProgress: (progress) => set({ syncProgress: progress }),
      addNotification: (message, type = 'info') => {
        const notification = {
          id: Date.now().toString(),
          message,
          type: type as 'success' | 'error' | 'info'
        };
        set((state) => ({
          notifications: [...state.notifications, notification]
        }));
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== notification.id)
          }));
        }, 3000);
      },

      // User actions
      login: (user, sessionId) => {
        set({ currentUser: user, currentSessionId: sessionId });
      },
      logout: () => {
        set({ currentUser: null, currentSessionId: '' });
        firestoreUnsubscribers.forEach(unsub => unsub());
        firestoreUnsubscribers = [];
      },
      updateCurrentUser: (user) => {
        set({ currentUser: user });
      },

      // CRUD operations
      addUser: async (user) => {
        try {
          await setDoc(doc(db, 'users', user.id), user);
          get().addNotification('تم إضافة المستخدم بنجاح', 'success');
        } catch (e) {
          console.error('Error adding user:', e);
          get().addNotification('فشل في إضافة المستخدم', 'error');
          throw e;
        }
      },
      updateUser: async (user) => {
        try {
          await setDoc(doc(db, 'users', user.id), user);
          get().addNotification('تم تحديث المستخدم بنجاح', 'success');
        } catch (e) {
          console.error('Error updating user:', e);
          get().addNotification('فشل في تحديث المستخدم', 'error');
          throw e;
        }
      },
      deleteUser: async (userId) => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          get().addNotification('تم حذف المستخدم بنجاح', 'success');
        } catch (e) {
          console.error('Error deleting user:', e);
          get().addNotification('فشل في حذف المستخدم', 'error');
          throw e;
        }
      },

      addRevenueReport: async (report) => {
        try {
          await setDoc(doc(db, 'revenueReports', report.id), report);
          get().addNotification('تم إضافة التقرير بنجاح', 'success');
        } catch (e) {
          console.error('Error adding report:', e);
          get().addNotification('فشل في إضافة التقرير', 'error');
          throw e;
        }
      },
      updateRevenueReport: async (report) => {
        try {
          await setDoc(doc(db, 'revenueReports', report.id), report);
          get().addNotification('تم تحديث التقرير بنجاح', 'success');
        } catch (e) {
          console.error('Error updating report:', e);
          get().addNotification('فشل في تحديث التقرير', 'error');
          throw e;
        }
      },
      deleteRevenueReport: async (reportId) => {
        try {
          await deleteDoc(doc(db, 'revenueReports', reportId));
          get().addNotification('تم حذف التقرير بنجاح', 'success');
        } catch (e) {
          console.error('Error deleting report:', e);
          get().addNotification('فشل في حذف التقرير', 'error');
          throw e;
        }
      },

      addInventoryReport: async (report) => {
        try {
          await setDoc(doc(db, 'inventoryReports', report.id), report);
          get().addNotification('تم إضافة التقرير بنجاح', 'success');
        } catch (e) {
          console.error('Error adding report:', e);
          throw e;
        }
      },
      updateInventoryReport: async (report) => {
        try {
          await setDoc(doc(db, 'inventoryReports', report.id), report);
        } catch (e) {
          console.error('Error updating report:', e);
          throw e;
        }
      },
      deleteInventoryReport: async (reportId) => {
        try {
          await deleteDoc(doc(db, 'inventoryReports', reportId));
        } catch (e) {
          console.error('Error deleting report:', e);
          throw e;
        }
      },

      addInspectionReport: async (report) => {
        try {
          await setDoc(doc(db, 'inspectionReports', report.id), report);
        } catch (e) {
          console.error('Error adding report:', e);
          throw e;
        }
      },
      updateInspectionReport: async (report) => {
        try {
          await setDoc(doc(db, 'inspectionReports', report.id), report);
        } catch (e) {
          console.error('Error updating report:', e);
          throw e;
        }
      },
      deleteInspectionReport: async (reportId) => {
        try {
          await deleteDoc(doc(db, 'inspectionReports', reportId));
        } catch (e) {
          console.error('Error deleting report:', e);
          throw e;
        }
      },

      addTicket: async (ticket) => {
        try {
          await setDoc(doc(db, 'tickets', ticket.id), ticket);
        } catch (e) {
          console.error('Error adding ticket:', e);
          throw e;
        }
      },
      updateTicket: async (ticket) => {
        try {
          await setDoc(doc(db, 'tickets', ticket.id), ticket);
        } catch (e) {
          console.error('Error updating ticket:', e);
          throw e;
        }
      },
      deleteTicket: async (ticketId) => {
        try {
          await deleteDoc(doc(db, 'tickets', ticketId));
        } catch (e) {
          console.error('Error deleting ticket:', e);
          throw e;
        }
      },

      addCarHandover: async (handover) => {
        try {
          await setDoc(doc(db, 'carHandovers', handover.id), handover);
        } catch (e) {
          console.error('Error adding handover:', e);
          throw e;
        }
      },
      updateCarHandover: async (handover) => {
        try {
          await setDoc(doc(db, 'carHandovers', handover.id), handover);
        } catch (e) {
          console.error('Error updating handover:', e);
          throw e;
        }
      },
      deleteCarHandover: async (handoverId) => {
        try {
          await deleteDoc(doc(db, 'carHandovers', handoverId));
        } catch (e) {
          console.error('Error deleting handover:', e);
          throw e;
        }
      },

      addReadingRecord: async (record) => {
        try {
          await setDoc(doc(db, 'readingRecords', record.id), record);
        } catch (e) {
          console.error('Error adding record:', e);
          throw e;
        }
      },
      updateReadingRecord: async (record) => {
        try {
          await setDoc(doc(db, 'readingRecords', record.id), record);
        } catch (e) {
          console.error('Error updating record:', e);
          throw e;
        }
      },
      deleteReadingRecord: async (recordId) => {
        try {
          await deleteDoc(doc(db, 'readingRecords', recordId));
        } catch (e) {
          console.error('Error deleting record:', e);
          throw e;
        }
      },

      addInventoryItem: async (item) => {
        try {
          await setDoc(doc(db, 'inventoryItems', item.id), item);
        } catch (e) {
          console.error('Error adding item:', e);
          throw e;
        }
      },
      updateInventoryItem: async (item) => {
        try {
          await setDoc(doc(db, 'inventoryItems', item.id), item);
        } catch (e) {
          console.error('Error updating item:', e);
          throw e;
        }
      },
      deleteInventoryItem: async (itemId) => {
        try {
          await deleteDoc(doc(db, 'inventoryItems', itemId));
        } catch (e) {
          console.error('Error deleting item:', e);
          throw e;
        }
      },

      addBranch: async (branch) => {
        try {
          await setDoc(doc(db, 'branches', branch.id), branch);
        } catch (e) {
          console.error('Error adding branch:', e);
          throw e;
        }
      },
      updateBranch: async (branch) => {
        try {
          await setDoc(doc(db, 'branches', branch.id), branch);
        } catch (e) {
          console.error('Error updating branch:', e);
          throw e;
        }
      },
      deleteBranch: async (branchId) => {
        try {
          await deleteDoc(doc(db, 'branches', branchId));
        } catch (e) {
          console.error('Error deleting branch:', e);
          throw e;
        }
      },

      addCar: async (car) => {
        try {
          await setDoc(doc(db, 'cars', car.id), car);
        } catch (e) {
          console.error('Error adding car:', e);
          throw e;
        }
      },
      updateCar: async (car) => {
        try {
          await setDoc(doc(db, 'cars', car.id), car);
        } catch (e) {
          console.error('Error updating car:', e);
          throw e;
        }
      },
      deleteCar: async (carId) => {
        try {
          await deleteDoc(doc(db, 'cars', carId));
        } catch (e) {
          console.error('Error deleting car:', e);
          throw e;
        }
      },

      addCustomRole: async (role) => {
        try {
          await setDoc(doc(db, 'customRoles', role.id), role);
        } catch (e) {
          console.error('Error adding role:', e);
          throw e;
        }
      },
      updateCustomRole: async (role) => {
        try {
          await setDoc(doc(db, 'customRoles', role.id), role);
        } catch (e) {
          console.error('Error updating role:', e);
          throw e;
        }
      },
      deleteCustomRole: async (roleId) => {
        try {
          await deleteDoc(doc(db, 'customRoles', roleId));
        } catch (e) {
          console.error('Error deleting role:', e);
          throw e;
        }
      },

      addScheduledReadingItem: async (item) => {
        try {
          await setDoc(doc(db, 'scheduledReadingItems', item.id), item);
        } catch (e) {
          console.error('Error adding item:', e);
          throw e;
        }
      },
      updateScheduledReadingItem: async (item) => {
        try {
          await setDoc(doc(db, 'scheduledReadingItems', item.id), item);
        } catch (e) {
          console.error('Error updating item:', e);
          throw e;
        }
      },
      deleteScheduledReadingItem: async (itemId) => {
        try {
          await deleteDoc(doc(db, 'scheduledReadingItems', itemId));
        } catch (e) {
          console.error('Error deleting item:', e);
          throw e;
        }
      },
    }),
    {
      name: 'ffc-store-firebase'
    }
  )
);

// Initialize Firestore sync
export const initFirestoreSync = async (
  targetCollections: string[] = GLOBAL_COLLECTIONS
) => {
  const state = useStore.getState();
  const currentUser = state.currentUser;

  const requiredCollections = currentUser
    ? [...new Set([...GLOBAL_COLLECTIONS, ...targetCollections])]
    : [...GLOBAL_COLLECTIONS];

  state.setIsLoading(true);

  try {
    // Load collections
    for (const col of requiredCollections) {
      const collectionRef = collection(db, col);

      let q: Query;

      // Filter by branchId for non-global collections if user is not admin
      if (!GLOBAL_COLLECTIONS.includes(col) && currentUser?.branchId) {
        const userRole = state.customRoles.find(r => r.id === currentUser?.roleId);
        const canViewAll = userRole?.permissions.includes('view_all_branches');

        if (!canViewAll) {
          q = query(collectionRef, where('branchId', '==', currentUser.branchId));
        } else {
          q = query(collectionRef);
        }
      } else {
        q = query(collectionRef);
      }

      // Set up real-time listener
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        useStore.setState({ [col]: data } as any);
      }, (error) => {
        console.error(`Error listening to ${col}:`, error);
        state.setSyncStatus(col, 'error', error.message);
      });

      firestoreUnsubscribers.push(unsub);
    }

    state.setIsLoading(false);
  } catch (error) {
    console.error('Error initializing Firestore sync:', error);
    state.setIsLoading(false);
  }
};
