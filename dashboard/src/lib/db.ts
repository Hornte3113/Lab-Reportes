// src/lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
   
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    // error en terminal
    console.error('Error ejecutando query:', error);
    throw error;
  }
};