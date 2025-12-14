import { Pool } from '@neondatabase/serverless';
import { checkAutomod, sanitizeMessage } from './automod.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS guestbook_entries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved BOOLEAN DEFAULT true
      );

      CREATE INDEX IF NOT EXISTS idx_created_at ON guestbook_entries(created_at DESC);
    `);
  } finally {
    client.release();
  }
}

async function getEntries(limit = 50) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, name, message, created_at FROM guestbook_entries WHERE approved = true ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

async function addEntry(name, message) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO guestbook_entries (name, message) VALUES ($1, $2) RETURNING id, name, message, created_at',
      [name, message]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    await initializeDatabase();

    if (req.method === 'GET') {
      try {
        const entries = await getEntries();
        return res.status(200).json(entries || []);
      } catch (error) {
        console.error('Database error:', error);
        return res.status(200).json([]);
      }
    } 
    else if (req.method === 'POST') {
      try {
        const { name, message } = req.body || {};

        if (!name || !message) {
          return res.status(400).json({ error: 'Name and message are required' });
        }

        if (name.length > 100) {
          return res.status(400).json({ error: 'Name must be 100 characters or less' });
        }


        const sanitizedName = sanitizeMessage(name);
        const sanitizedMessage = sanitizeMessage(message);

        const modCheck = checkAutomod(sanitizedMessage);
        if (!modCheck.approved) {
          return res.status(400).json({ error: modCheck.reason });
        }


        const entry = await addEntry(sanitizedName, sanitizedMessage);
        return res.status(201).json(entry);
      } catch (error) {
        console.error('POST error:', error);
        return res.status(500).json({ error: 'Failed to submit message' });
      }
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
