const pool = require('../config/database');

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Dropping email columns and clearing values');
        // set to null for safety
        await conn.query('UPDATE admin SET email = NULL');
        await conn.query('UPDATE panelist SET email = NULL');
        await conn.query('UPDATE participant SET email = NULL');

        // drop columns if exist
        await conn.query('ALTER TABLE admin DROP COLUMN IF EXISTS email');
        await conn.query('ALTER TABLE panelist DROP COLUMN IF EXISTS email');
        await conn.query('ALTER TABLE participant DROP COLUMN IF EXISTS email');

        console.log('Email columns removed');
        conn.release();
    } catch (e) {
        console.error('Error removing email columns', e);
    } finally {
        process.exit(0);
    }
})();