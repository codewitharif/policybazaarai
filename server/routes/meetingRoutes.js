const express = require('express');
const router = express.Router();
const meetingControllers = require('../controllers/meetingControllers');

// Connection Status
router.get('/status', meetingControllers.getConnectionStatus);

// CRUD
router.get('/', meetingControllers.getAllMeetings);
router.get('/:id', meetingControllers.getMeetingById);
router.post('/', meetingControllers.createMeeting);
router.put('/:id', meetingControllers.updateMeeting);
router.delete('/:id', meetingControllers.deleteMeeting);

// OAuth
router.get('/google/auth', meetingControllers.googleAuth);
router.get('/google/callback', meetingControllers.googleCallback);
router.get('/zoom/auth', meetingControllers.zoomAuth);
router.get('/zoom/callback', meetingControllers.zoomCallback);

module.exports = router;
