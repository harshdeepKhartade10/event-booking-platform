const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register
router.post('/register', authController.register);
// Email Verification (expects { code } in body)
router.post('/verify-email', authController.verifyEmail);
// Login
router.post('/login', authController.login);
// Get Profile (Protected)
router.get('/profile', auth, authController.getProfile);

module.exports = router;
