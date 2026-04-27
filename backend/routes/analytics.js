// Handles routes for viewing form analytics data.
const express = require('express');
const { getFormAnalytics, exportAnalyticsPdf } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/form/:formId/report.pdf', protect, exportAnalyticsPdf);
router.get('/form/:formId', protect, getFormAnalytics);

module.exports = router;
