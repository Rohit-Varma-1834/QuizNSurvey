const express = require('express');
const { body } = require('express-validator');
const {
  getForms, getForm, createForm, updateForm, deleteForm,
  duplicateForm, publishForm, getDashboardStats
} = require('../controllers/formController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/', getForms);
router.get('/:id', getForm);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['quiz', 'survey']).withMessage('Type must be quiz or survey')
], createForm);

router.put('/:id', updateForm);
router.delete('/:id', deleteForm);
router.post('/:id/duplicate', duplicateForm);
router.post('/:id/publish', publishForm);

module.exports = router;
