const express = require('express');
const { getPublicForm } = require('../controllers/publicController');
const router = express.Router();

router.get('/form/:publicId', getPublicForm);

module.exports = router;
