import { Pool } from '@neondatabase/serverless';

// Initialize the pool
// Note: In a real production app, you should be careful about exposing credentials in client-side code.
// For a purely client-side app using Neon, ensure you have proper RLS (Row Level Security) or use a backend proxy.
// However, Neon serverless driver allows connecting from edge/serverless environments.
// If running in browser, this will work but credentials in VITE_DATABASE_URL will be visible to users.
const pool = new Pool({
    connectionString: import.meta.env.VITE_DATABASE_URL,
    disableWarningInBrowsers: true,
});

export const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
};

export default pool;
