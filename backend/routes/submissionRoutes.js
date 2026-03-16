const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { adminAuthMiddleware } = require('../middleware/auth');

router.use(adminAuthMiddleware);

router.post('/import-google-sheet', submissionController.importFromGoogleSheet);
router.get('/', submissionController.getSubmissions);

module.exports = router;
