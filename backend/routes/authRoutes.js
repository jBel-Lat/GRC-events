const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes (no auth required)
router.post('/admin/login', authController.adminLogin);
router.post('/panelist/login', authController.panelistLogin);
router.post('/student/login', authController.studentLogin);

module.exports = router;
