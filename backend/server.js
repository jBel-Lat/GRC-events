const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const participantRoutes = require('./routes/participantRoutes');
const panelistRoutes = require('./routes/panelistRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

const ADMIN_BASE = '/$2b$10$RkzXnPj4T9OQh7m9l1LkOe6dTjY9pJv8b3Zf4R2nKxLq5VgHcW8aS';
const ADMIN_BASE_ENC = '/%242b%2410%24RkzXnPj4T9OQh7m9l1LkOe6dTjY9pJv8b3Zf4R2nKxLq5VgHcW8aS';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/panelists', panelistRoutes);
app.use('/api/students', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Custom admin login/dashboard paths
app.get(ADMIN_BASE, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/admin/index.html'));
});
app.get(`${ADMIN_BASE}/dashboard.html`, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/admin/dashboard.html'));
});
app.get(ADMIN_BASE_ENC, (req, res) => res.redirect(ADMIN_BASE));
app.get(`${ADMIN_BASE}/`, (req, res) => res.redirect(ADMIN_BASE));
app.get(`${ADMIN_BASE_ENC}/`, (req, res) => res.redirect(ADMIN_BASE));
app.get('/admin', (req, res) => res.redirect(ADMIN_BASE));
app.get('/admin/dashboard.html', (req, res) => res.redirect(`${ADMIN_BASE}/dashboard.html`));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin login: http://localhost:${PORT}${ADMIN_LOGIN_PATH}`);
    console.log(`Panelist login: http://localhost:${PORT}/panelist`);
});
