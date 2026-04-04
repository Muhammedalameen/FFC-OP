import { createClient } from "@libsql/client";

// Use HTTPS for better compatibility with Vercel serverless
const isVercel = !!process.env.VERCEL;
const baseUrl = "libsql://ffc-op-md1amin.aws-ap-northeast-1.turso.io";
const httpUrl = "https://ffc-op-md1amin.aws-ap-northeast-1.turso.io";

export const db = createClient({
  url: isVercel ? httpUrl : baseUrl,
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUzMDExODgsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.gCZpSC_JinDmNz0yE9SO-qXZM_BMqhh99P1e8jvRznxQarszBMCcJYEfXNgGzywJP7sK_E-T8hv1Ga-lEqXZAg"
});

export const initDb = async () => {
  console.log('[DB] Starting database initialization...');
  console.log('[DB] Node env:', process.env.NODE_ENV);
  console.log('[DB] Vercel:', process.env.VERCEL || 'false');
  console.log('[DB] Vercel runtime:', process.env.AWS_REGION ? 'AWS Lambda' : 'Other');
  
  // Test connection first
  try {
    console.log('[DB] Testing connection...');
    const result = await db.execute("SELECT 1");
    console.log('[DB] ✅ Connection test successful:', result.rows);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : 'No stack';
    console.error('[DB] ❌ Connection test failed!');
    console.error('[DB] Error message:', errorMsg);
    console.error('[DB] Error stack:', errorStack);
    console.error('[DB] Error name:', err instanceof Error ? err.name : 'Unknown');
    console.error('[DB] Error cause:', err instanceof Error && err.cause ? err.cause : 'No cause');
    throw new Error(`Turso connection failed: ${errorMsg}`);
  }

  // Create tables if they don't exist
  // Since we are storing JSON objects from the frontend, we can use a generic key-value store approach
  // or a document store approach for simplicity, similar to Firebase.

  const tables = [
    'users', 'customRoles', 'branches', 'cars', 'inventoryItems',
    'operationalItems', 'revenueReports', 'inventoryReports',
    'inspectionReports', 'scheduledReadingItems', 'readingRecords',
    'tickets', 'carHandovers'
  ];

  for (const table of tables) {
    console.log(`[DB] Creating table: ${table}`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  console.log('[DB] All tables created/verified');

  // Seed default admin user if users table is empty or admin is missing
  try {
    const adminCheck = await db.execute("SELECT * FROM users WHERE id = 'u1'");
    if (adminCheck.rows.length === 0) {
      const adminUser = {
        id: 'u1',
        employeeId: 'admin',
        pin: '1234',
        name: 'مدير النظام',
        roleId: 'r1'
      };
      await db.execute({
        sql: "INSERT INTO users (id, data) VALUES (?, ?)",
        args: ['u1', JSON.stringify(adminUser)]
      });
      console.log("Default admin user seeded.");
    }

    // Seed roles if empty
    const roleCheck = await db.execute("SELECT * FROM customRoles");
    if (roleCheck.rows.length === 0) {
      const initialRoles = [
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
      for (const role of initialRoles) {
        await db.execute({
          sql: "INSERT INTO customRoles (id, data) VALUES (?, ?)",
          args: [role.id, JSON.stringify(role)]
        });
      }
      console.log("Initial roles seeded.");
    }
  } catch (e) {
    console.error("Error seeding data:", e);
  }

  console.log("[DB] Database tables initialized successfully.");
};
