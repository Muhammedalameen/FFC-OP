import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

// Load environment variables (only on local, not on Vercel)
if (!process.env.VERCEL) {
  dotenv.config();
}

// Database setup
const dbUrl = process.env.TURSO_DB_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  throw new Error("TURSO_DB_URL or TURSO_CONNECTION_URL environment variable is not set");
}

if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN environment variable is not set");
}

const db = createClient({
  url: dbUrl,
  authToken: authToken
});

const initDb = async () => {
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

// Express app setup
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize DB tables
let dbInitialized = false;
const ensureDb = async () => {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
};

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('Failed to initialize DB:', err);
    res.status(500).json({ error: 'Database initialization failed', details: err instanceof Error ? err.message : String(err) });
  }
});

// API Routes for generic collections
app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  try {
    const result = await db.execute(`SELECT * FROM ${collection}`);
    const data = result.rows.map(row => JSON.parse(row.data as string));
    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const body = req.body;
  const id = body.id;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    await db.execute({
      sql: `INSERT INTO ${collection} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updatedAt = CURRENT_TIMESTAMP`,
      args: [id, JSON.stringify(body)]
    });
    res.json({ success: true });
  } catch (error) {
    console.error(`Error saving to ${collection}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  try {
    await db.execute({
      sql: `DELETE FROM ${collection} WHERE id = ?`,
      args: [id]
    });
    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting from ${collection}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health/ping', (req, res) => {
  res.json({ status: 'ok' });
});

// Only setup Vite and Listen if NOT on Vercel
if (!process.env.VERCEL) {
  async function setupVite() {
    const { createServer: createViteServer } = await import('vite');
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  setupVite();
}

export default app;
