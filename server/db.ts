import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, categories, tasks } from '@shared/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

export { users, categories, tasks };