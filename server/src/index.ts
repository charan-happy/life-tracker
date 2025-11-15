import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { ensureSchema, pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const SaveSchema = z.object({
  userId: z.string().min(1),
  data: z.object({}).passthrough(),
});

app.post('/api/sync/save', async (req, res) => {
  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { userId, data } = parsed.data;
  try {
    await pool.query(
      `INSERT INTO user_data (user_id, data, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = now();`,
      [userId, data]
    );
    res.json({ ok: true });
  } catch (e: any) {
    console.error('save error', e);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/api/sync/load', async (req, res) => {
  const userId = (req.query.userId as string) || '';
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const r = await pool.query('SELECT data FROM user_data WHERE user_id = $1', [userId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ data: r.rows[0].data });
  } catch (e: any) {
    console.error('load error', e);
    res.status(500).json({ error: 'Failed to load' });
  }
});

const port = process.env.PORT || 4000;

(async () => {
  try {
    if (process.env.DATABASE_URL) {
      await ensureSchema();
    } else {
      console.warn('[server] DATABASE_URL not set; Cloud Sync endpoints will fail.');
    }
    app.listen(port, () => console.log(`[server] listening on :${port}`));
  } catch (e) {
    console.error('server start error', e);
    process.exit(1);
  }
})();
