const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

// Get all panelists
exports.getAllPanelists = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [panelists] = await connection.query(
            'SELECT id, username, full_name, status, created_at FROM panelist'
        );
        connection.release();

        res.json({
            success: true,
            data: panelists
        });
    } catch (error) {
        console.error('Get panelists error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create new panelist
exports.createPanelist = async (req, res) => {
    try {
        const { username, password, full_name } = req.body;
        const adminId = req.user.id;

        if (!username || !password || !full_name) {
            console.warn('Create panelist missing fields', { username, password, full_name });
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.PANELIST_FIELDS_REQUIRED,
                received: { username, full_name, password: password ? '***' : '' }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await pool.getConnection();
        
        // Check if username exists
        const [existing] = await connection.query('SELECT id FROM panelist WHERE username = ?', [username]);
        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        await connection.query(
            'INSERT INTO panelist (username, password, full_name, created_by) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, full_name, adminId]
        );

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Panelist created successfully'
        });
    } catch (error) {
        console.error('Create panelist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update panelist
exports.updatePanelist = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, full_name, password } = req.body;

        // Validate required fields
        if (!username || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Username and full name are required'
            });
        }

        const connection = await pool.getConnection();
        
        // If password is provided, hash it and update it
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.query(
                'UPDATE panelist SET username = ?, password = ?, full_name = ? WHERE id = ?',
                [username, hashedPassword, full_name, id]
            );
        } else {
            // Update without password
            await connection.query(
                'UPDATE panelist SET username = ?, full_name = ? WHERE id = ?',
                [username, full_name, id]
            );
        }

        connection.release();

        res.json({
            success: true,
            message: SUCCESS_MESSAGES.UPDATED_SUCCESS
        });
    } catch (error) {
        console.error('Update panelist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete panelist
exports.deletePanelist = async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();
        await connection.query('DELETE FROM panelist WHERE id = ?', [id]);
        connection.release();

        res.json({
            success: true,
            message: SUCCESS_MESSAGES.DELETED_SUCCESS
        });
    } catch (error) {
        console.error('Delete panelist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Assign panelist to event
exports.assignPanelistToEvent = async (req, res) => {
    try {
        const { panelist_id, event_id } = req.body;
        const adminId = req.user.id;

        const connection = await pool.getConnection();
        
        // Check if already assigned
        const [existing] = await connection.query(
            'SELECT id FROM panelist_event_assignment WHERE panelist_id = ? AND event_id = ?',
            [panelist_id, event_id]
        );

        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Panelist already assigned to this event'
            });
        }

        await connection.query(
            'INSERT INTO panelist_event_assignment (panelist_id, event_id, assigned_by) VALUES (?, ?, ?)',
            [panelist_id, event_id, adminId]
        );

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Panelist assigned to event successfully'
        });
    } catch (error) {
        console.error('Assign panelist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Remove panelist from event
exports.removePanelistFromEvent = async (req, res) => {
    try {
        const { panelist_id, event_id } = req.params;

        const connection = await pool.getConnection();
        await connection.query(
            'DELETE FROM panelist_event_assignment WHERE panelist_id = ? AND event_id = ?',
            [panelist_id, event_id]
        );
        connection.release();

        res.json({
            success: true,
            message: SUCCESS_MESSAGES.DELETED_SUCCESS
        });
    } catch (error) {
        console.error('Remove panelist from event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get assigned event IDs for a specific panelist (admin)
exports.getAssignedEventsForPanelist = async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT event_id FROM panelist_event_assignment WHERE panelist_id = ?',
            [id]
        );
        connection.release();

        const eventIds = rows.map(r => r.event_id);

        res.json({
            success: true,
            data: eventIds
        });
    } catch (error) {
        console.error('Get assigned events for panelist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get panelist assigned events
exports.getPanelistAssignedEvents = async (req, res) => {
    try {
        const panelistId = req.user.id;

        const connection = await pool.getConnection();
        const [events] = await connection.query(
            `SELECT e.id, e.event_name, e.description, e.start_date, e.end_date, e.status
             FROM event e
             INNER JOIN panelist_event_assignment pea ON e.id = pea.event_id
             WHERE pea.panelist_id = ?`,
            [panelistId]
        );
        connection.release();

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Get panelist events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
