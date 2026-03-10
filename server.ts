import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  host: process.env.DB_HOST || 'ffc-sa.duckdns.org',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'workflow_db',
  user: process.env.DB_USER || 'workflow_user',
  password: process.env.DB_PASSWORD || '@ccflex1234',
});

// Initialize database tables
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_data (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL
      );
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

initDb();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Generic endpoint to get all store data
app.get('/api/store/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query('SELECT data FROM store_data WHERE id = $1', [name]);
    if (result.rows.length > 0) {
      res.json(result.rows[0].data);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error('Error fetching store data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic endpoint to save store data
app.post('/api/store/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { data } = req.body;
    await pool.query(
      'INSERT INTO store_data (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      [name, data]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving store data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic endpoint to delete store data
app.delete('/api/store/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await pool.query('DELETE FROM store_data WHERE id = $1', [name]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting store data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
