const pool = require('../config/database');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');
const XLSX = require('xlsx');
const multer = require('multer');
const importUpload = multer({ storage: multer.memoryStorage() });

// Get all students (admin)
exports.getAllStudents = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [students] = await connection.query(
            'SELECT id, name, student_number, status, created_at FROM student'
        );
        connection.release();

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// middleware for excel upload
exports.importStudentsUploadMiddleware = importUpload.single('file');

// Import students from Excel (Name, School ID)
exports.importStudentsFromExcel = async (req, res) => {
    try {
        const { file } = req;
        if (!file) {
            return res.status(400).json({ success: false, message: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS });
        }

        const wb = XLSX.read(file.buffer, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const formatRegex = /^\d{4}-\d{2}-\d{5}$/;
        let processed = 0, inserted = 0, duplicates = 0, invalid = 0;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (let i = 1; i < rows.length; i++) { // assume first row header
                const name = (rows[i][0] || '').toString().trim();
                const schoolId = (rows[i][1] || '').toString().trim();
                if (!name || !schoolId) {
                    if (!name && !schoolId) continue;
                    invalid++;
                    continue;
                }
                if (!formatRegex.test(schoolId)) {
                    invalid++;
                    continue;
                }
                processed++;
                const [existing] = await connection.query(
                    'SELECT id FROM student WHERE student_number = ? LIMIT 1',
                    [schoolId]
                );
                if (existing.length) {
                    duplicates++;
                    continue;
                }
                await connection.query(
                    'INSERT INTO student (name, student_number, status) VALUES (?, ?, ?)',
                    [name, schoolId, 'active']
                );
                inserted++;
            }
            await connection.commit();
            connection.release();
            res.json({
                success: true,
                data: { processed, inserted, duplicates, invalid }
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('Import students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Export students to Excel
exports.exportStudentsToExcel = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT name, student_number FROM student ORDER BY name ASC'
        );
        connection.release();

        const data = [['Name', 'School ID'], ...rows.map(r => [r.name || '', r.student_number || ''])];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error) {
        console.error('Export students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create new student (admin)
exports.createStudent = async (req, res) => {
    try {
        const { name, student_number } = req.body;
        const adminId = req.user.id;

        if (!name || !student_number) {
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
            });
        }

        const connection = await pool.getConnection();
        const [existing] = await connection.query(
            'SELECT id FROM student WHERE student_number = ?',
            [student_number]
        );
        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Student number already exists'
            });
        }

        await connection.query(
            'INSERT INTO student (name, student_number, created_by) VALUES (?, ?, ?)',
            [name, student_number, adminId]
        );

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Student created successfully'
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update student (admin)
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, student_number, status } = req.body;

        if (!name || !student_number) {
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
            });
        }

        const connection = await pool.getConnection();
        await connection.query(
            'UPDATE student SET name = ?, student_number = ?, status = ? WHERE id = ?',
            [name, student_number, status || 'active', id]
        );
        connection.release();

        res.json({
            success: true,
            message: SUCCESS_MESSAGES.UPDATED_SUCCESS
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete student (admin)
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM student WHERE id = ?', [id]);
        connection.release();

        res.json({
            success: true,
            message: SUCCESS_MESSAGES.DELETED_SUCCESS
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Assign student to event (admin)
exports.assignStudentToEvent = async (req, res) => {
    try {
        const { student_id, event_id } = req.body;
        const adminId = req.user.id;

        const connection = await pool.getConnection();
        const [existing] = await connection.query(
            'SELECT id FROM student_event_assignment WHERE student_id = ? AND event_id = ?',
            [student_id, event_id]
        );
        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Student already assigned to this event'
            });
        }

        await connection.query(
            'INSERT INTO student_event_assignment (student_id, event_id, assigned_by) VALUES (?, ?, ?)',
            [student_id, event_id, adminId]
        );
        connection.release();

        res.status(201).json({
            success: true,
            message: 'Student assigned to event successfully'
        });
    } catch (error) {
        console.error('Assign student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Remove student from event (admin)
exports.removeStudentFromEvent = async (req, res) => {
    try {
        const { student_id, event_id } = req.params;
        const connection = await pool.getConnection();
        await connection.query(
            'DELETE FROM student_event_assignment WHERE student_id = ? AND event_id = ?',
            [student_id, event_id]
        );
        connection.release();

        res.json({
            success: true,
            message: SUCCESS_MESSAGES.DELETED_SUCCESS
        });
    } catch (error) {
        console.error('Remove student event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Assign events to all students (admin)
exports.assignEventsToAllStudents = async (req, res) => {
    try {
        const { event_ids } = req.body;
        const adminId = req.user.id;

        if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one event'
            });
        }

        const connection = await pool.getConnection();

        // Get all active students
        const [students] = await connection.query(
            'SELECT id FROM student WHERE status = "active"'
        );

        // Assign each event to each student
        for (const eventId of event_ids) {
            for (const student of students) {
                try {
                    // Check if already assigned
                    const [existing] = await connection.query(
                        'SELECT id FROM student_event_assignment WHERE student_id = ? AND event_id = ?',
                        [student.id, eventId]
                    );
                    
                    // Only insert if not already assigned
                    if (existing.length === 0) {
                        await connection.query(
                            'INSERT INTO student_event_assignment (student_id, event_id, assigned_by) VALUES (?, ?, ?)',
                            [student.id, eventId, adminId]
                        );
                    }
                } catch (err) {
                    console.error(`Error assigning student ${student.id} to event ${eventId}:`, err);
                }
            }
        }

        connection.release();

        res.json({
            success: true,
            message: `Events assigned to all students successfully`
        });
    } catch (error) {
        console.error('Assign events to all students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get assigned event IDs for a specific student (admin)
exports.getAssignedEventsForStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT event_id FROM student_event_assignment WHERE student_id = ?',
            [id]
        );
        connection.release();

        const eventIds = rows.map(r => r.event_id);
        res.json({ success: true, data: eventIds });
    } catch (error) {
        console.error('Get assigned events for student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Student endpoints
// (student must already be authenticated by token produced at login)

// Get events assigned to authenticated student
exports.getStudentAssignedEvents = async (req, res) => {
    try {
        const studentId = req.user.id;
        const connection = await pool.getConnection();
        const [events] = await connection.query(
            `SELECT e.id, e.event_name, e.description, e.start_date, e.end_date, e.status
             FROM event e
             INNER JOIN student_event_assignment sea ON e.id = sea.event_id
             WHERE sea.student_id = ?`,
            [studentId]
        );
        connection.release();

        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Get student events error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
