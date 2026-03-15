const pool = require('../config/database');

(async () => {
    try {
        const conn = await pool.getConnection();
        const [parts] = await conn.query('SELECT id, participant_name, event_id, team_name FROM participant');
        console.log('Participants:', parts);
        const [assign] = await conn.query('SELECT * FROM panelist_event_assignment');
        console.log('Assignments:', assign);
        conn.release();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();