const express = require('express');
const router = express.Router();
const { login, signup, checkReferral } = require('../controllers/authController');
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/check-referral', checkReferral);

// Admin routes (protected)
router.get('/admin/users', protect, getAllUsers);
router.delete('/admin/users/:userId', protect, deleteUser);

module.exports = router; 