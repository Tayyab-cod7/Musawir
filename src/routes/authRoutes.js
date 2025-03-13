const express = require('express');
const router = express.Router();
const { login, signup, checkReferral } = require('../controllers/authController.js');
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const { getUserEarnings, earn50 } = require('../controllers/userControllers.js'); 
const { protect } = require('../middleware/auth');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/check-referral', checkReferral);

// User earnings routes
router.get('/user/earnings', protect, getUserEarnings);
router.post('/user/earn-50', protect, earn50); // ✅ Fix: Correct function name

// Admin routes (protected)
router.get('/admin/users', protect, getAllUsers);
router.delete('/admin/users/:userId', protect, deleteUser);

module.exports = router;
