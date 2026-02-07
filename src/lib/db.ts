import { Pool, QueryResult, QueryResultRow } from 'pg';

// Database connection pool configuration optimized for serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Fail connection after 10s
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a parameterized SQL query
 * All queries MUST use parameterized values to prevent SQL injection
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const result = await pool.query<T>(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return the first row or null
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 */
export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: {
    query: <R extends QueryResultRow = QueryResultRow>(text: string, params?: any[]) => Promise<QueryResult<R>>;
    queryOne: <R extends QueryResultRow = QueryResultRow>(text: string, params?: any[]) => Promise<R | null>;
    queryMany: <R extends QueryResultRow = QueryResultRow>(text: string, params?: any[]) => Promise<R[]>;
  }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await callback({
      query: <R extends QueryResultRow>(text: string, params?: any[]) => 
        client.query<R>(text, params),
      queryOne: async <R extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<R | null> => {
        const res = await client.query<R>(text, params);
        return res.rows[0] || null;
      },
      queryMany: async <R extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<R[]> => {
        const res = await client.query<R>(text, params);
        return res.rows;
      },
    });
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// Export the pool for direct access if needed
export { pool };
