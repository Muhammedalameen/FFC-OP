import express from 'express';
import cors from 'cors';
import path from 'path';
import { db, initDb } from './db';

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
