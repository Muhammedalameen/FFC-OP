import { createClient } from "@libsql/client";

/**
 * إعدادات قاعدة البيانات
 * يفضل دائماً وضع الروابط والتوكن في متغيرات البيئة في Vercel
 * لضمان الأمان وتسهيل الإدارة.
 */
const url = process.env.TURSO_DATABASE_URL || "libsql://ffc-op-md1amin.aws-ap-northeast-1.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUzMDExODgsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.gCZpSC_JinDmNz0yE9SO-qXZM_BMqhh99P1e8jvRznxQarszBMCcJYEfXNgGzywJP7sK_E-T8hv1Ga-lEqXZAg";

export const db = createClient({
  url: url,
  authToken: authToken,
});

export const initDb = async () => {
  console.log('[DB] Initializing connection...');
  
  try {
    // اختبار الاتصال بأقل استعلام ممكن
    await db.execute("SELECT 1");
    console.log('[DB] ✅ Connection verified.');

    // قائمة الجداول المطلوب إنشاؤها
    const tables = [
      'users', 'customRoles', 'branches', 'cars', 'inventoryItems',
      'operationalItems', 'revenueReports', 'inventoryReports',
      'inspectionReports', 'scheduledReadingItems', 'readingRecords',
      'tickets', 'carHandovers'
    ];

    // تنفيذ عمليات إنشاء الجداول
    for (const table of tables) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // التحقق من وجود المستخدم المسؤول (Seed Admin)
    const adminCheck = await db.execute({
      sql: "SELECT id FROM users WHERE id = ?",
      args: ['u1']
    });

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
      console.log("[DB] Default admin user seeded.");
    }

    // التحقق من وجود الأدوار (Seed Roles)
    const roleCheck = await db.execute("SELECT id FROM customRoles LIMIT 1");
    if (roleCheck.rows.length === 0) {
      const initialRoles = [
        { id: 'r1', name: 'مدير نظام', permissions: ['view_all_branches', 'manage_system', 'add_reports', 'delete_reports', 'manage_tickets', 'approve_reports', 'view_revenue', 'add_revenue', 'edit_revenue', 'delete_revenue', 'view_inventory', 'add_inventory', 'edit_inventory', 'delete_inventory', 'view_scheduled', 'add_scheduled', 'edit_scheduled', 'delete_scheduled', 'view_maintenance', 'add_maintenance', 'edit_maintenance', 'delete_maintenance', 'approve_maintenance_cost', 'view_purchase', 'add_purchase', 'edit_purchase', 'delete_purchase', 'view_cars', 'manage_cars', 'view_car_handovers', 'add_car_handovers'] },
        { id: 'r2', name: 'مدير منطقة', permissions: ['view_all_branches', 'approve_reports', 'approve_maintenance_cost', 'view_revenue', 'view_inventory', 'view_scheduled', 'view_maintenance', 'view_purchase', 'view_cars', 'view_car_handovers'] },
        { id: 'r3', name: 'مدير فرع', permissions: ['add_reports', 'view_revenue', 'add_revenue', 'view_inventory', 'add_inventory', 'view_scheduled', 'add_scheduled', 'view_maintenance', 'add_maintenance', 'view_purchase', 'add_purchase', 'view_cars', 'view_car_handovers'] },
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
      console.log("[DB] Initial roles seeded.");
    }

    console.log("[DB] Database ready.");
  } catch (err) {
    console.error('[DB] ❌ Critical Error during initialization:');
    console.error('Message:', err.message);
    // في بيئة Serverless، يفضل رمي الخطأ ليظهر في Logs المنصة
    throw err;
  }
};
