const express = require('express');
const router = express.Router();
const panelistController = require('../controllers/panelistController');
const { adminAuthMiddleware, panelistAuthMiddleware } = require('../middleware/auth');

// Admin panelist management routes
router.get('/', adminAuthMiddleware, panelistController.getAllPanelists);
router.post('/', adminAuthMiddleware, panelistController.createPanelist);

// Specific routes before parameterized routes
router.post('/assign-event', adminAuthMiddleware, panelistController.assignPanelistToEvent);
// Get assigned events for a specific panelist (admin)
router.get('/:id/events', adminAuthMiddleware, panelistController.getAssignedEventsForPanelist);

// Panelist routes (defined before parameterized admin routes)
router.get('/assigned-events', panelistAuthMiddleware, panelistController.getPanelistAssignedEvents);

// Parameterized routes (these come last)
router.put('/:id', adminAuthMiddleware, panelistController.updatePanelist);
router.delete('/:id', adminAuthMiddleware, panelistController.deletePanelist);
router.delete('/:panelist_id/event/:event_id', adminAuthMiddleware, panelistController.removePanelistFromEvent);

module.exports = router;
