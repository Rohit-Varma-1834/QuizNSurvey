// Handles routes for user profile and account settings.
const express = require('express');
const { updateProfile, updatePassword, updateEmail, updateAvatar, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.put('/email', updateEmail);
router.put('/avatar', updateAvatar);
router.delete('/account', deleteAccount);

module.exports = router;
