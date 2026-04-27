// Handles routes for submitting and viewing form responses.
// routes/responses.js
const express = require('express');
const { submitResponse, getFormResponses, exportFormResponsesCsv, deleteResponse } = require('../controllers/responseController');
const { protect, optionalAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/submit/:publicId', optionalAuth, submitResponse);
router.get('/form/:formId/export', protect, exportFormResponsesCsv);
router.get('/form/:formId', protect, getFormResponses);
router.delete('/:id', protect, deleteResponse);

module.exports = router;
