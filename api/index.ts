import { createClient } from "@libsql/client";

// Initialize Turso client directly in the API function
const db = createClient({
  url: "https://ffc-op-md1amin.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUzMDExODgsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.gCZpSC_JinDmNz0yE9SO-qXZM_BMqhh99P1e8jvRznxQarszBMCcJYEfXNgGzywJP7sK_E-T8hv1Ga-lEqXZAg"
});

// Initialize DB tables on first request
let dbInitialized = false;
const initDb = async () => {
  if (dbInitialized) return;
  console.log('[API] Initializing database...');
  
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
  
  // Seed default admin user
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
      console.log('[API] Default admin user seeded.');
    }

    const roleCheck = await db.execute("SELECT * FROM customRoles");
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
      console.log('[API] Initial roles seeded.');
    }
  } catch (e) {
    console.error('[API] Error seeding data:', e);
  }

  dbInitialized = true;
  console.log('[API] Database initialized successfully.');
};

// Helper: parse URL
function parseUrl(url: string) {
  const pathname = url.split('?')[0];
  const parts = pathname.split('/').filter(Boolean);
  // /api/:collection or /api/:collection/:id or /api/health/ping
  return { parts, pathname };
}

export default async function handler(req: Request) {
  try {
    // Initialize DB on first request
    await initDb();

    const url = new URL(req.url || '', 'http://localhost');
    const { parts, pathname } = parseUrl(url.pathname);

    // Health check
    if (pathname === '/api/health/ping') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API routes: /api/:collection or /api/:collection/:id
    if (parts[0] !== 'api') {
      return new Response('Not found', { status: 404 });
    }

    const collection = parts[1];
    const id = parts[2];

    // GET /api/:collection
    if (req.method === 'GET' && !id) {
      const result = await db.execute(`SELECT * FROM ${collection}`);
      const data = result.rows.map(row => JSON.parse(row.data as string));
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/:collection
    if (req.method === 'POST') {
      const body = await req.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      await db.execute({
        sql: `INSERT INTO ${collection} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updatedAt = CURRENT_TIMESTAMP`,
        args: [body.id, JSON.stringify(body)]
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // DELETE /api/:collection/:id
    if (req.method === 'DELETE' && id) {
      await db.execute({
        sql: `DELETE FROM ${collection} WHERE id = ?`,
        args: [id]
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
