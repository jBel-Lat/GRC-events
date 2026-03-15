const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { adminAuthMiddleware, studentAuthMiddleware } = require('../middleware/auth');

// Admin student management
router.get('/', adminAuthMiddleware, studentController.getAllStudents);
router.post('/', adminAuthMiddleware, studentController.createStudent);
router.post('/import-excel', adminAuthMiddleware, studentController.importStudentsUploadMiddleware, studentController.importStudentsFromExcel);
router.get('/export-excel', adminAuthMiddleware, studentController.exportStudentsToExcel);
router.post('/assign-event', adminAuthMiddleware, studentController.assignStudentToEvent);
router.post('/assign-events-bulk', adminAuthMiddleware, studentController.assignEventsToAllStudents);
router.get('/:id/events', adminAuthMiddleware, studentController.getAssignedEventsForStudent);
router.put('/:id', adminAuthMiddleware, studentController.updateStudent);
router.delete('/:id', adminAuthMiddleware, studentController.deleteStudent);
router.delete('/:student_id/event/:event_id', adminAuthMiddleware, studentController.removeStudentFromEvent);

// Student routes
router.get('/assigned-events', studentAuthMiddleware, studentController.getStudentAssignedEvents);

module.exports = router;
