import { createClient } from "@libsql/client";

// Initialize Turso client
const db = createClient({
  url: "https://ffc-op-md1amin.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUzMDExODgsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.gCZpSC_JinDmNz0yE9SO-qXZM_BMqhh99P1e8jvRznxQarszBMCcJYEfXNgGzywJP7sK_E-T8hv1Ga-lEqXZAg"
});

// Initialize DB tables
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
      await db.execute({
        sql: "INSERT INTO users (id, data) VALUES (?, ?)",
        args: ['u1', JSON.stringify({
          id: 'u1',
          employeeId: 'admin',
          pin: '1234',
          name: 'مدير النظام',
          roleId: 'r1'
        })]
      });
      console.log('[API] Admin user seeded.');
    }

    const roleCheck = await db.execute("SELECT * FROM customRoles");
    if (roleCheck.rows.length === 0) {
      const roles = [
        { id: 'r1', name: 'مدير نظام', permissions: ['view_all_branches', 'manage_system', 'add_reports', 'delete_reports', 'manage_tickets', 'approve_reports', 'view_revenue', 'add_revenue', 'edit_revenue', 'delete_revenue', 'view_inventory', 'add_inventory', 'edit_inventory', 'delete_inventory', 'view_scheduled', 'add_scheduled', 'edit_scheduled', 'delete_scheduled', 'view_maintenance', 'add_maintenance', 'edit_maintenance', 'delete_maintenance', 'approve_maintenance_cost', 'view_purchase', 'add_purchase', 'edit_purchase', 'delete_purchase', 'view_cars', 'manage_cars', 'view_car_handovers', 'add_car_handovers'] },
        { id: 'r2', name: 'مدير منطقة', permissions: ['view_all_branches', 'approve_reports', 'approve_maintenance_cost', 'view_revenue', 'view_inventory', 'view_scheduled', 'view_maintenance', 'view_purchase', 'view_cars', 'view_car_handovers'] },
        { id: 'r3', name: 'مدير فرع', permissions: ['add_reports', 'view_revenue', 'add_revenue', 'view_inventory', 'add_inventory', 'view_scheduled', 'add_scheduled', 'view_maintenance', 'add_maintenance', 'view_purchase', 'add_purchase', 'view_cars', 'view_car_handovers'] },
        { id: 'r4', name: 'مسؤول صيانة', permissions: ['view_maintenance_only', 'view_maintenance', 'add_maintenance', 'edit_maintenance'] },
        { id: 'r5', name: 'مسؤول مستودع', permissions: ['view_inventory_only', 'view_all_branches', 'view_inventory', 'add_inventory'] },
        { id: 'r6', name: 'سائق', permissions: ['view_cars', 'view_car_handovers', 'add_car_handovers'] },
      ];
      for (const role of roles) {
        await db.execute({
          sql: "INSERT INTO customRoles (id, data) VALUES (?, ?)",
          args: [role.id, JSON.stringify(role)]
        });
      }
      console.log('[API] Roles seeded.');
    }
  } catch (e) {
    console.error('[API] Seed error:', e);
  }

  dbInitialized = true;
  console.log('[API] Database ready.');
};

// Vercel Function Handler
export default async function handler(request: Request): Promise<Response> {
  // Get pathname safely - Vercel provides just the path in request.url
  const fullUrl = request.url || '';
  let pathname: string;
  try {
    pathname = new URL(fullUrl).pathname;
  } catch {
    // If URL parsing fails, use the path directly
    pathname = fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl;
  }
  
  const method = request.method;

  console.log(`[API] ${method} ${pathname} (fullUrl: ${fullUrl})`);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    await initDb();

    // Health check
    if (pathname === '/api/health/ping') {
      return Response.json({ status: 'ok', dbInitialized }, { headers: corsHeaders });
    }

    // Parse /api/:collection/:id?
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] !== 'api') {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    const collection = parts[1];
    const id = parts[2];

    // GET /api/:collection
    if (method === 'GET' && collection && !id) {
      const result = await db.execute(`SELECT * FROM ${collection}`);
      const data = result.rows.map(row => JSON.parse(row.data as string));
      console.log(`[API] GET ${collection}: ${data.length} items`);
      return Response.json(data, { headers: corsHeaders });
    }

    // GET /api/:collection/:id
    if (method === 'GET' && collection && id) {
      const result = await db.execute({
        sql: `SELECT * FROM ${collection} WHERE id = ?`,
        args: [id]
      });
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return Response.json(JSON.parse(result.rows[0].data as string), { headers: corsHeaders });
    }

    // POST /api/:collection
    if (method === 'POST' && collection) {
      const body = await request.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      await db.execute({
        sql: `INSERT INTO ${collection} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updatedAt = CURRENT_TIMESTAMP`,
        args: [body.id, JSON.stringify(body)]
      });
      console.log(`[API] POST ${collection}: ${body.id}`);
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    // DELETE /api/:collection/:id
    if (method === 'DELETE' && collection && id) {
      await db.execute({
        sql: `DELETE FROM ${collection} WHERE id = ?`,
        args: [id]
      });
      console.log(`[API] DELETE ${collection}: ${id}`);
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
