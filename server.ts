import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { db, initDb } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Initialize DB tables
  await initDb();

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

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
