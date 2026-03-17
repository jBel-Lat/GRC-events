const jwt = require('jsonwebtoken');

function parseCookies(req) {
    const header = req.headers?.cookie || '';
    return header.split(';').reduce((acc, part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return acc;
        const key = part.slice(0, idx).trim();
        const value = decodeURIComponent(part.slice(idx + 1).trim());
        if (key) acc[key] = value;
        return acc;
    }, {});
}

function getTokenFromRequest(req) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const bearerMatch = String(authHeader).match(/^Bearer\s+(.+)$/i);
    const cookieToken = parseCookies(req).admin_token || null;
    return (bearerMatch && bearerMatch[1]) || req.headers['x-access-token'] || cookieToken || null;
}

const authMiddleware = (req, res, next) => {
    const token = getTokenFromRequest(req);

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
        if ((req.user.role || '').toLowerCase() !== 'admin') {
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
        if ((req.user.role || '').toLowerCase() !== 'panelist') {
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
        if ((req.user.role || '').toLowerCase() !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Student access required'
            });
        }
        next();
    });
};

const adminOnlyMiddleware = adminAuthMiddleware;

const adminPageAuthMiddleware = (req, res, next) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).send('Server misconfiguration: JWT secret missing');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if ((decoded.role || '').toLowerCase() !== 'admin') {
            return res.status(403).send('Forbidden: Admin role required');
        }
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).send('Unauthorized: Invalid or expired token');
    }
};

module.exports = {
    authMiddleware,
    adminAuthMiddleware,
    adminOnlyMiddleware,
    adminPageAuthMiddleware,
    panelistAuthMiddleware,
    studentAuthMiddleware
};
