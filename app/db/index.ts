import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';


const sql = neon(process.env.DATABASE_URL!, { 
  fetchOptions: { cache: 'no-store' }
});

// Create drizzle database instance
const db = drizzle(sql);

export default db;