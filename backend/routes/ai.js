// Handles AI-assisted question generation routes.
const express = require('express');
const { generateQuestions, summarizeResponses, analyzeSentiment } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/generate-questions', protect, generateQuestions);
router.post('/summarize-responses/:formId', protect, summarizeResponses);
router.post('/sentiment/:formId', protect, analyzeSentiment);

module.exports = router;
