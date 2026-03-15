/**
 * Seed a sample Hackathon event with criteria, 5 teams, and 4 members per team.
 * Safe to run multiple times; it will reuse existing admin/event/criteria/participants.
 */
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function ensureAdmin(connection) {
    const username = 'sample_admin';
    const password = 'password123';
    const fullName = 'Sample Admin';

    const [existing] = await connection.query(
        'SELECT id FROM admin WHERE username = ? LIMIT 1',
        [username]
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
        'INSERT INTO admin (username, password, full_name) VALUES (?, ?, ?)',
        [username, hashed, fullName]
    );

    console.log(`Created admin "${username}" with password "${password}" (id=${result.insertId})`);
    return result.insertId;
}

async function ensureEvent(connection, adminId) {
    const eventName = 'Sample Hackathon Event';
    const description = 'Demo event with sample teams and members.';

    const [existing] = await connection.query(
        'SELECT id FROM event WHERE event_name = ? LIMIT 1',
        [eventName]
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    const [result] = await connection.query(
        `INSERT INTO event (event_name, description, start_date, end_date, status, created_by, is_elimination, is_tournament, student_weight, panelist_weight)
         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'upcoming', ?, false, false, 50, 50)`,
        [eventName, description, adminId]
    );

    console.log(`Created event "${eventName}" (id=${result.insertId})`);
    return result.insertId;
}

async function ensureCriteria(connection, eventId) {
    const criteria = [
        { name: 'Innovation', percentage: 40, max: 10 },
        { name: 'Impact', percentage: 30, max: 10 },
        { name: 'Technical Execution', percentage: 30, max: 10 },
    ];

    for (const crit of criteria) {
        const [exists] = await connection.query(
            'SELECT id FROM criteria WHERE event_id = ? AND criteria_name = ? LIMIT 1',
            [eventId, crit.name]
        );
        if (exists.length === 0) {
            await connection.query(
                'INSERT INTO criteria (event_id, criteria_name, percentage, max_score) VALUES (?, ?, ?, ?)',
                [eventId, crit.name, crit.percentage, crit.max]
            );
            console.log(`Added criteria "${crit.name}"`);
        }
    }
}

async function ensureTeams(connection, eventId) {
    const teams = [
        { name: 'Team Orion', members: ['Alice Vega', 'Ben Torres', 'Cara Li', 'Drew Patel'] },
        { name: 'Team Nova', members: ['Evan Cruz', 'Farah Singh', 'Gio Kim', 'Hana Brooks'] },
        { name: 'Team Apex', members: ['Ivan Reed', 'Jules Park', 'Kara Moss', 'Liam Stone'] },
        { name: 'Team Pulse', members: ['Mina Cho', 'Nate Ward', 'Omar Diaz', 'Pia Jensen'] },
        { name: 'Team Forge', members: ['Quinn Lake', 'Rae Young', 'Sami Holt', 'Tess Price'] },
    ];

    for (const team of teams) {
        const [existing] = await connection.query(
            'SELECT COUNT(*) AS count FROM participant WHERE event_id = ? AND team_name = ?',
            [eventId, team.name]
        );
        let registrationNumber = existing[0].count + 1;

        for (const member of team.members) {
            const [present] = await connection.query(
                'SELECT id FROM participant WHERE event_id = ? AND team_name = ? AND participant_name = ? LIMIT 1',
                [eventId, team.name, member]
            );
            if (present.length > 0) continue;

            await connection.query(
                'INSERT INTO participant (event_id, participant_name, team_name, registration_number) VALUES (?, ?, ?, ?)',
                [eventId, member, team.name, registrationNumber]
            );
            registrationNumber += 1;
            console.log(`Added ${member} to ${team.name}`);
        }
    }
}

(async () => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const adminId = await ensureAdmin(connection);
        const eventId = await ensureEvent(connection, adminId);
        await ensureCriteria(connection, eventId);
        await ensureTeams(connection, eventId);

        await connection.commit();
        console.log('Seeding complete.');
    } catch (err) {
        await connection.rollback();
        console.error('Seeding failed:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
})();
