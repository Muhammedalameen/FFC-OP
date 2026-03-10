import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore, Ticket, ReadingRecord } from '../store';

export default function NotificationManager() {
  const currentUser = useStore((state) => state.currentUser);
  
  // Keep track of previously seen IDs to avoid duplicate notifications
  const seenTickets = useRef<Set<string>>(new Set());
  const seenReadings = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!currentUser) return;

    const state = useStore.getState();
    const userRole = state.customRoles.find(r => r.id === currentUser.roleId);
    // Check if user is admin or region manager
    const isEligible = userRole?.name === 'مدير نظام' || userRole?.name === 'مدير منطقة' || userRole?.name === 'مدير النظام';

    if (!isEligible) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const docRef = doc(db, 'store_data', 'restaurant-system-storage');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;
      
      const data = docSnap.data().data;
      if (!data || !data.state) return;
      
      const tickets: Ticket[] = data.state.tickets || [];
      const readingRecords: ReadingRecord[] = data.state.readingRecords || [];

      if (isInitialLoad.current) {
        // Just populate the seen sets on initial load
        tickets.forEach(t => seenTickets.current.add(t.id));
        readingRecords.forEach(r => seenReadings.current.add(r.id));
        isInitialLoad.current = false;
        return;
      }

      const currentState = useStore.getState();

      // Check for new tickets
      tickets.forEach(ticket => {
        if (!seenTickets.current.has(ticket.id)) {
          seenTickets.current.add(ticket.id);
          
          // Don't notify if the current user created it
          if (ticket.createdBy !== currentUser.id) {
            const typeName = ticket.type === 'maintenance' ? 'طلب صيانة' : 'طلب مشتريات';
            const branchName = currentState.branches.find(b => b.id === ticket.branchId)?.name || 'فرع غير معروف';
            
            // In-app notification
            currentState.addNotification(`تم تسجيل ${typeName} جديد في ${branchName}`, 'info', 5000);

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`تم تسجيل ${typeName} جديد`, {
                body: `العنوان: ${ticket.title}\nالفرع: ${branchName}`,
                icon: '/vite.svg'
              });
            }
          }
        }
      });

      // Check for new reading records
      readingRecords.forEach(record => {
        if (!seenReadings.current.has(record.id)) {
          seenReadings.current.add(record.id);
          
          // Don't notify if the current user created it
          if (record.recordedBy !== currentUser.id) {
            const branchName = currentState.branches.find(b => b.id === record.branchId)?.name || 'فرع غير معروف';
            const itemName = currentState.scheduledReadingItems.find(i => i.id === record.itemId)?.name || 'عنصر غير معروف';
            
            // In-app notification
            currentState.addNotification(`تم تسجيل فحص قراءة مجدولة جديد في ${branchName}`, 'info', 5000);

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('تم تسجيل فحص قراءة مجدولة جديد', {
                body: `الفرع: ${branchName}\nالفحص: ${itemName}`,
                icon: '/vite.svg'
              });
            }
          }
        }
      });
    });

    return () => {
      unsubscribe();
      isInitialLoad.current = true;
      seenTickets.current.clear();
      seenReadings.current.clear();
    };
  }, [currentUser]);

  return null;
}
