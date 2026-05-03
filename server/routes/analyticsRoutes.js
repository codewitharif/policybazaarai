const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsControllers');

router.get('/dashboard-stats', analyticsController.getDashboardStats);
router.get('/dashboard-summary', analyticsController.getAdminDashboardSummary);

module.exports = router;
