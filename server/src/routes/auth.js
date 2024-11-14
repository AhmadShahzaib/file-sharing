const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

// Routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/verify', auth, authController.verifyToken);

module.exports = router; 