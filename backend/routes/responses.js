// routes/responses.js
const express = require('express');
const { submitResponse, getFormResponses, deleteResponse } = require('../controllers/responseController');
const { protect, optionalAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/submit/:publicId', optionalAuth, submitResponse);
router.get('/form/:formId', protect, getFormResponses);
router.delete('/:id', protect, deleteResponse);

module.exports = router;
