import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local from project root
config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function migrate() {
  console.log('🔄 Running migration: Add avatarUrl column to users table...');
  
  const client = await pool.connect();
  
  try {
    // Add avatarUrl column if it doesn't exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
    `);
    
    console.log('✅ Migration completed: avatarUrl column added to users table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
