import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://ffc-op-md1amin.aws-ap-northeast-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0MDU4OTEsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.YaZPoGQp6rH_flN0oO6GmvQZW2sfhHAzM21RwVq-CcuXIP-U5KPGuXgnSl7_82-VZUtDpMAJCygWJWJX5WBiCw"
});

export const initDb = async () => {
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
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

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

  console.log("Database tables initialized.");
};
