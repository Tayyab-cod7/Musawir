const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
    try {
        // Get all users with necessary fields
        const users = await User.find()
            .select('phone referralCode referredBy createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching users',
            error: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { adminPassword } = req.body;
        const { userId } = req.params;

        // Verify admin password
        const admin = await User.findOne({ phone: '03151251123' }).select('+password');
        const isPasswordCorrect = await admin.matchPassword(adminPassword);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid admin password'
            });
        }

        // Don't allow deleting admin
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (userToDelete.phone === '03151251123') {
            return res.status(403).json({
                status: 'error',
                message: 'Cannot delete admin account'
            });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting user',
            error: error.message
        });
    }
}; 