import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const COLLECTIONS_TO_SYNC = [
  'users', 'customRoles', 'branches', 'cars', 'inventoryItems', 
  'operationalItems', 'revenueReports', 'inventoryReports', 
  'inspectionReports', 'scheduledReadingItems', 'readingRecords', 
  'tickets', 'carHandovers'
];

let isTursoInitialized = false;
const tursoLoadedCollections = new Set<string>();
let isReceivingFromTurso = false;

let activeListeners: Record<string, NodeJS.Timeout> = {};
let activeQueries: Record<string, string> = {};
let isLocalListenerInitialized = false;

export const GLOBAL_COLLECTIONS = ['users', 'customRoles', 'branches'];

const API_BASE = '/api';

export const initTursoSync = async (
  targetCollections: string[] = GLOBAL_COLLECTIONS,
  dateRange?: { start: string, end: string }
) => {
  const state = useStore.getState();
  const currentUser = state.currentUser;
  
  // Set loading only if we are actually loading new collections
  const requiredCollections = currentUser 
    ? [...new Set([...GLOBAL_COLLECTIONS, ...targetCollections])]
    : [...GLOBAL_COLLECTIONS];
    
  const needsLoading = requiredCollections.some(col => !tursoLoadedCollections.has(col));
  if (needsLoading) {
    state.setIsLoading(true);
  }
  
  // 1. Migration & Initial push (only once for the whole system)
  if (!isTursoInitialized) {
    isTursoInitialized = true; 
    // Initial fetch of global collections
    for (const col of GLOBAL_COLLECTIONS) {
      try {
        const res = await fetch(`${API_BASE}/${col}`);
        if (res.ok) {
          const remoteData = await res.json();
          const localData = state[col as keyof AppState];
          
          if (remoteData.length === 0 && Array.isArray(localData) && localData.length > 0) {
            // Push local to remote if remote is empty
            state.setIsLoading(true);
            await Promise.all(localData.map((item: any) => 
              fetch(`${API_BASE}/${col}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
              })
            ));
            state.setIsLoading(false);
          }
        }
      } catch (e) {
        console.error(`Error initializing ${col}:`, e);
      }
    }
  }

  // 2. Unsubscribe from collections no longer needed
  // We keep GLOBAL_COLLECTIONS always active
  Object.keys(activeListeners).forEach(col => {
    if (!requiredCollections.includes(col)) {
      clearInterval(activeListeners[col]);
      delete activeListeners[col];
      delete activeQueries[col];
      tursoLoadedCollections.delete(col);
      console.log(`Unsubscribed from ${col}`);
    }
  });

  // 3. Listen to Turso changes (Polling for now)
  requiredCollections.forEach(col => {
    
    // Apply branch filter for branch managers
    const userRole = state.customRoles.find(r => r.id === currentUser?.roleId);
    const canViewAll = userRole?.permissions.includes('view_all_branches');
    
    let queryParams: any = { branchId: canViewAll ? 'all' : currentUser?.branchId };

    if (!canViewAll && currentUser?.branchId) {
      const branchCollections = ['revenueReports', 'inventoryReports', 'inspectionReports', 'tickets', 'carHandovers', 'readingRecords'];
      if (branchCollections.includes(col)) {
        queryParams.branchId = currentUser.branchId;
      }
    }

    // Apply date filter if provided
    if (dateRange && ['revenueReports', 'inventoryReports', 'inspectionReports', 'tickets', 'readingRecords'].includes(col)) {
      queryParams.dateRange = dateRange;
    } else if (dateRange && col === 'carHandovers') {
      queryParams.dateRange = dateRange;
    }

    const queryKey = JSON.stringify(queryParams);

    if (activeListeners[col]) {
      if (activeQueries[col] === queryKey) {
        // If already loaded and query hasn't changed, we don't need to wait for it
        return; 
      } else {
        // Query changed, unsubscribe first
        clearInterval(activeListeners[col]);
        console.log(`Query changed for ${col}, resubscribing...`);
      }
    }

    activeQueries[col] = queryKey;

    const fetchRemoteData = async (isInitial = false) => {
      try {
        const res = await fetch(`${API_BASE}/${col}`);
        if (!res.ok) throw new Error('Failed to fetch');
        let remoteData = await res.json();
        
        // Apply client-side filtering since our basic API returns all
        if (queryParams.branchId && queryParams.branchId !== 'all') {
          remoteData = remoteData.filter((item: any) => item.branchId === queryParams.branchId);
        }
        if (queryParams.dateRange) {
           if (col === 'carHandovers') {
             remoteData = remoteData.filter((item: any) => item.createdAt >= queryParams.dateRange.start && item.createdAt <= queryParams.dateRange.end + 'T23:59:59');
           } else {
             remoteData = remoteData.filter((item: any) => item.date >= queryParams.dateRange.start && item.date <= queryParams.dateRange.end);
           }
        }

        const localData = useStore.getState()[col as keyof AppState];
        
        tursoLoadedCollections.add(col);
        
        // Check if all required collections are loaded
        const allLoaded = requiredCollections.every(c => tursoLoadedCollections.has(c));
        if (allLoaded) {
          useStore.getState().setIsLoading(false);
        }
        
        // Single session check for users collection
        if (col === 'users') {
          const state = useStore.getState();
          if (state.currentUser) {
            const remoteUser = remoteData.find((u: any) => u.id === state.currentUser?.id);
            if (remoteUser && remoteUser.sessionId && remoteUser.sessionId !== state.currentSessionId) {
              // New session detected elsewhere
              state.logout();
              state.addNotification('تم تسجيل الدخول من جهاز آخر، تم تسجيل خروجك تلقائياً', 'info');
              return;
            }
          }
        }
        
        if (JSON.stringify(remoteData) !== JSON.stringify(localData)) {
          isReceivingFromTurso = true;
          useStore.setState({ [col]: remoteData } as any);
          isReceivingFromTurso = false;
        }
      } catch (error) {
        console.error(`Error fetching ${col}:`, error);
        useStore.getState().setIsLoading(false);
      }
    };

    // Initial fetch
    fetchRemoteData(true);
    
    // Poll every 5 seconds
    const interval = setInterval(fetchRemoteData, 5000);
    activeListeners[col] = interval;
    console.log(`Subscribed to ${col}`);
  });

  if (requiredCollections.length === 0 || requiredCollections.every(c => tursoLoadedCollections.has(c))) {
    state.setIsLoading(false);
  }

  // 3. Listen to local changes and push to Turso
  if (!isLocalListenerInitialized) {
    isLocalListenerInitialized = true;
    const syncTimeouts: Record<string, NodeJS.Timeout> = {};
    const baseStates: Record<string, any[]> = {}; // Store the state before changes started
    
    useStore.subscribe((state, prevState) => {
      COLLECTIONS_TO_SYNC.forEach(col => {
        if (!tursoLoadedCollections.has(col)) return;

        const localData = state[col as keyof AppState] as any[];
        const prevLocalData = prevState[col as keyof AppState] as any[];
        
        if (localData !== prevLocalData && !isReceivingFromTurso && Array.isArray(localData) && Array.isArray(prevLocalData)) {
          // If no timeout is active, this is the first change in a batch
          if (!syncTimeouts[col]) {
            baseStates[col] = prevLocalData;
          }

          if (syncTimeouts[col]) {
            clearTimeout(syncTimeouts[col]);
          }
          
          state.setIsLoading(true);
          state.setSyncStatus(col, 'pending');
          
          syncTimeouts[col] = setTimeout(() => {
            const baseData = baseStates[col] || prevLocalData;
            delete baseStates[col];
            delete syncTimeouts[col];
            
            const added = localData.filter((item: any) => !baseData.find((p: any) => p.id === item.id));
            const updated = localData.filter((item: any) => {
              const prev = baseData.find((p: any) => p.id === item.id);
              return prev && JSON.stringify(prev) !== JSON.stringify(item);
            });
            const deleted = baseData.filter((item: any) => !localData.find((p: any) => p.id === item.id));

            const promises = [
              ...added.map((item: any) => fetch(`${API_BASE}/${col}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })),
              ...updated.map((item: any) => fetch(`${API_BASE}/${col}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })),
              ...deleted.map((item: any) => fetch(`${API_BASE}/${col}/${item.id}`, { method: 'DELETE' }))
            ];

            if (promises.length === 0) {
              useStore.getState().setSyncStatus(col, 'success');
              useStore.getState().setIsLoading(false);
              return;
            }

            state.setSyncStatus(col, 'syncing');
            const total = promises.length;
            let current = 0;
            
            state.setSyncProgress({ current: 0, total });

            const trackProgress = (p: Promise<any>) => p.then(res => {
              current++;
              useStore.getState().setSyncProgress({ current, total });
              return res;
            });

            Promise.all(promises.map(trackProgress)).then(() => {
              useStore.getState().setSyncStatus(col, 'success');
              useStore.getState().setIsLoading(false);
              useStore.getState().setSyncProgress(null);
            }).catch(e => {
              console.error(`Error saving ${col} to Turso:`, e);
              useStore.getState().setSyncStatus(col, 'error', e.message);
              useStore.getState().setIsLoading(false);
              useStore.getState().setSyncProgress(null);
            });
          }, 1000);
        }
      });
    });
  }
};

export const AVAILABLE_PERMISSIONS = [
  { id: 'view_all_branches', name: 'الاطلاع على كافة الفروع', category: 'عام' },
  { id: 'manage_system', name: 'إدارة النظام (المستخدمين، الفروع، الصلاحيات، الإعدادات)', category: 'عام' },
  
  // Revenue Permissions
  { id: 'view_revenue', name: 'عرض الإيرادات', category: 'الإيرادات' },
  { id: 'add_revenue', name: 'إضافة إيراد', category: 'الإيرادات' },
  { id: 'edit_revenue', name: 'تعديل إيراد', category: 'الإيرادات' },
  { id: 'delete_revenue', name: 'حذف إيراد', category: 'الإيرادات' },

  // Inventory Permissions
  { id: 'view_inventory', name: 'عرض المخزون', category: 'المخزون' },
  { id: 'add_inventory', name: 'إضافة مخزون', category: 'المخزون' },
  { id: 'edit_inventory', name: 'تعديل مخزون', category: 'المخزون' },
  { id: 'delete_inventory', name: 'حذف مخزون', category: 'المخزون' },
  { id: 'view_need_report', name: 'عرض تقارير الاحتياج', category: 'المخزون' },
  { id: 'view_waste_report', name: 'عرض تقارير الهدر', category: 'المخزون' },

  // Scheduled Readings Permissions
  { id: 'view_scheduled', name: 'عرض القراءات المجدولة', category: 'القراءات المجدولة' },
  { id: 'add_scheduled', name: 'إضافة قراءة مجدولة', category: 'القراءات المجدولة' },
  { id: 'edit_scheduled', name: 'تعديل قراءة مجدولة', category: 'القراءات المجدولة' },
  { id: 'delete_scheduled', name: 'حذف قراءة مجدولة', category: 'القراءات المجدولة' },

  // Maintenance Permissions
  { id: 'view_maintenance', name: 'عرض طلبات الصيانة', category: 'الصيانة' },
  { id: 'add_maintenance', name: 'إضافة طلب صيانة', category: 'الصيانة' },
  { id: 'edit_maintenance', name: 'تعديل طلب صيانة', category: 'الصيانة' },
  { id: 'delete_maintenance', name: 'حذف طلب صيانة', category: 'الصيانة' },
  { id: 'approve_maintenance_cost', name: 'اعتماد تكلفة الصيانة', category: 'الصيانة' },

  // Purchase Permissions
  { id: 'view_purchase', name: 'عرض طلبات الشراء', category: 'المشتريات' },
  { id: 'add_purchase', name: 'إضافة طلب شراء', category: 'المشتريات' },
  { id: 'edit_purchase', name: 'تعديل طلب شراء', category: 'المشتريات' },
  { id: 'delete_purchase', name: 'حذف طلب شراء', category: 'المشتريات' },

  // Car Handovers Permissions
  { id: 'view_cars', name: 'عرض السيارات', category: 'السيارات' },
  { id: 'manage_cars', name: 'إدارة السيارات', category: 'السيارات' },
  { id: 'view_car_handovers', name: 'عرض عمليات استلام السيارات', category: 'السيارات' },
  { id: 'add_car_handovers', name: 'إضافة عملية استلام سيارة', category: 'السيارات' },

  // Legacy/Other
  { id: 'add_reports', name: 'إضافة التقارير والطلبات (عام)', category: 'أخرى' },
  { id: 'delete_reports', name: 'حذف التقارير (عام)', category: 'أخرى' },
  { id: 'manage_tickets', name: 'إدارة التذاكر (تغيير الحالة والحذف)', category: 'أخرى' },
  { id: 'approve_reports', name: 'مراجعة واعتماد التقارير', category: 'أخرى' },
  { id: 'view_maintenance_only', name: 'الاطلاع على طلبات الصيانة فقط', category: 'أخرى' },
  { id: 'view_inventory_only', name: 'الاطلاع على تقارير المخزون والاحتياج والهدر فقط', category: 'أخرى' },
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
  sessionId?: string;
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
  branchId?: string;
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
  shiftReportImage?: string;
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
  scheduledTime?: string; // Legacy: HH:mm
  scheduledTimes?: string[]; // Array of HH:mm times
  category: string;
  requiredPhotosCount?: number; // Number of photos required for this reading
  branchIds?: string[]; // Array of branch IDs this reading applies to
}

export interface ReadingRecord {
  id: string;
  referenceNumber: string;
  branchId: string;
  itemId: string;
  value: string | number | boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (actual recording time)
  scheduledTime?: string; // The specific scheduled time this reading is for
  recordedBy: string;
  createdAt: string;
  image?: string; // Legacy single image
  images?: string[]; // Multiple images
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

export type SyncStatusType = 'idle' | 'pending' | 'syncing' | 'success' | 'error';

export interface SyncStatus {
  status: SyncStatusType;
  lastSynced: string | null;
  error?: string;
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
  currentSessionId: string | null;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  isDbConnected: boolean | null;
  syncStatuses: Record<string, SyncStatus>;
  isLoading: boolean;
  syncProgress: { current: number, total: number } | null;
  
  // Actions
  setIsLoading: (loading: boolean) => void;
  setSyncProgress: (progress: { current: number, total: number } | null) => void;
  setSyncStatus: (collection: string, status: SyncStatusType, error?: string) => void;
  checkDbConnection: () => Promise<void>;
  login: (employeeId: string, pin: string, rememberMe?: boolean) => Promise<boolean>;
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
  addInventoryItems: (items: Omit<InventoryItem, 'id'>[]) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  deleteBranchInventoryItems: (branchId: string) => void;
  deleteAllInventoryItems: () => void;
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
      currentSessionId: (() => {
        const sid = sessionStorage.getItem('restaurant_session_id');
        if (sid) return sid;
        
        // If not in sessionStorage, try to get it from the saved user in localStorage
        try {
          const savedUser = localStorage.getItem('restaurant_session_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.sessionId) {
              sessionStorage.setItem('restaurant_session_id', user.sessionId);
              return user.sessionId;
            }
          }
        } catch (e) {}
        return null;
      })(),
      theme: 'system',
      notifications: [],
      isDbConnected: null,
      syncStatuses: COLLECTIONS_TO_SYNC.reduce((acc, col) => {
        acc[col] = { status: 'idle', lastSynced: null };
        return acc;
      }, {} as Record<string, SyncStatus>),
      isLoading: false,
      syncProgress: null,

      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      setSyncProgress: (progress) => set({ syncProgress: progress }),

      setSyncStatus: (collection, status, error) => {
        set((state) => ({
          syncStatuses: {
            ...state.syncStatuses,
            [collection]: {
              status,
              lastSynced: status === 'success' ? new Date().toISOString() : state.syncStatuses[collection]?.lastSynced || null,
              error
            }
          }
        }));
      },

      checkDbConnection: async () => {
        get().setIsLoading(true);
        try {
          const res = await fetch('/api/health/ping');
          if (res.ok) {
            set({ isDbConnected: true });
          } else {
            set({ isDbConnected: false });
          }
        } catch (error) {
          console.error('Database connection check failed', error);
          set({ isDbConnected: false });
        } finally {
          get().setIsLoading(false);
        }
      },

      login: async (employeeId, pin, rememberMe) => {
        const user = get().users.find(u => u.employeeId === employeeId && u.pin === pin);
        if (user) {
          const sessionId = generateId();
          const updatedUser = { ...user, sessionId };
          
          set({ 
            currentUser: updatedUser,
            currentSessionId: sessionId
          });
          
          sessionStorage.setItem('restaurant_session_id', sessionId);

          if (rememberMe) {
            localStorage.setItem('restaurant_remember_me', 'true');
            localStorage.setItem('restaurant_session_user', JSON.stringify(updatedUser));
          } else {
            localStorage.removeItem('restaurant_remember_me');
            localStorage.removeItem('restaurant_session_user');
          }
          
          // Update user in Turso immediately to invalidate other sessions
          get().setIsLoading(true);
          try {
            await fetch(`/api/users/${user.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedUser)
            });
          } catch (e) {
            console.error('Error updating session in Turso:', e);
          } finally {
            get().setIsLoading(false);
          }
          
          initTursoSync();
          return true;
        }
        return false;
      },
      logout: () => {
        set({ 
          currentUser: null, 
          currentSessionId: null,
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
          carHandovers: []
        });
        localStorage.removeItem('restaurant_remember_me');
        localStorage.removeItem('restaurant_session_user');
        sessionStorage.removeItem('restaurant_session_id');
        initTursoSync();
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
      addInventoryItems: (items) => {
        set((state) => {
          const newItems = items.map(item => ({ ...item, id: generateId() }));
          return { inventoryItems: [...state.inventoryItems, ...newItems] };
        });
        get().addNotification(`تم إضافة ${items.length} صنف بنجاح`, 'success');
      },
      updateInventoryItem: (id, item) => {
        set((state) => ({ inventoryItems: state.inventoryItems.map(i => i.id === id ? { ...i, ...item } : i) }));
        get().addNotification('تم تحديث الصنف', 'success');
      },
      deleteInventoryItem: (id) => {
        set((state) => ({ inventoryItems: state.inventoryItems.filter(i => i.id !== id) }));
        get().addNotification('تم حذف الصنف', 'success');
      },
      deleteBranchInventoryItems: (branchId) => {
        set((state) => {
          const updatedItems = state.inventoryItems.map(item => {
            if (item.branchIds.includes(branchId)) {
              return { ...item, branchIds: item.branchIds.filter(id => id !== branchId) };
            }
            return item;
          }).filter(item => item.branchIds.length > 0);
          
          return { inventoryItems: updatedItems };
        });
        get().addNotification('تم حذف جميع أصناف الفرع بنجاح', 'success');
      },
      deleteAllInventoryItems: () => {
        set({ inventoryItems: [] });
        get().addNotification('تم حذف جميع أصناف المخزون بنجاح', 'success');
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
      partialize: (state) => {
        // Exclude all collections that are synced with Turso to ensure each device
        // fetches its own data separately from the database on every load.
        const { 
          currentUser, notifications, isDbConnected,
          users, customRoles, branches, cars, inventoryItems,
          operationalItems, revenueReports, inventoryReports,
          inspectionReports, scheduledReadingItems, readingRecords,
          tickets, carHandovers,
          ...rest 
        } = state;
        return rest;
      },
    }
  )
);
