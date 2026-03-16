const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const bearerMatch = String(authHeader).match(/^Bearer\s+(.+)$/i);
    const token = (bearerMatch && bearerMatch[1]) || req.headers['x-access-token'] || null;

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            success: false,
            message: 'JWT secret is not configured on server'
        });
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

const adminAuthMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        next();
    });
};

const panelistAuthMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'panelist') {
            return res.status(403).json({
                success: false,
                message: 'Panelist access required'
            });
        }
        next();
    });
};

const studentAuthMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Student access required'
            });
        }
        next();
    });
};

module.exports = {
    authMiddleware,
    adminAuthMiddleware,
    panelistAuthMiddleware,
    studentAuthMiddleware
};
