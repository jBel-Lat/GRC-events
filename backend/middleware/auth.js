const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

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
