import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
    connectionString: process.env.VITE_DATABASE_URL,
});

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../src/lib/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('Running schema migration...');
            await client.query(schemaSql);
            console.log('Database initialized successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
    }
}

initDb();
