const express = require('express');
const { getFormAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/form/:formId', protect, getFormAnalytics);

module.exports = router;
