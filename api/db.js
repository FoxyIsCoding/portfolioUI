import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase() {
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

export async function addGuestbookEntry(name, message) {
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

export async function getGuestbookEntries(limit = 50) {
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
