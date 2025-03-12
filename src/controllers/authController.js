const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Token will expire in 30 days
    });
};

// Ensure admin user exists
const ensureAdminExists = async () => {
    try {
        const adminPhone = '03151251123';
        const adminExists = await User.findOne({ phone: adminPhone });

        if (!adminExists) {
            await User.create({
                phone: adminPhone,
                password: 'admin123',
                plainPassword: 'admin123',
                referralCode: '000000',
                referredBy: '000000'
            });
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error ensuring admin exists:', error);
    }
};

// Call this when the server starts
ensureAdminExists();

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { phone, password, referralCode } = req.body;

        if (!phone || !password || !referralCode) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        // Prevent registration with admin phone number
        const ADMIN_PHONE = '03151251123';
        if (phone === ADMIN_PHONE) {
            return res.status(403).json({
                status: 'error',
                message: 'This phone number is reserved'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ phone });
        if (userExists) {
            return res.status(400).json({
                status: 'error',
                message: 'Phone number already registered'
            });
        }

        // Check if referral code exists or is admin code
        const ADMIN_REFERRAL = '000000';
        if (referralCode !== ADMIN_REFERRAL) {
            const referringUser = await User.findOne({ referralCode: referralCode });
            if (!referringUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid referral code'
                });
            }
        }

        // Generate unique referral code for new user
        let newReferralCode;
        let isUnique = false;
        while (!isUnique) {
            // Generate a random 6-digit number
            newReferralCode = Math.floor(100000 + Math.random() * 900000).toString();
            // Check if it exists
            const exists = await User.findOne({ referralCode: newReferralCode });
            if (!exists && newReferralCode !== ADMIN_REFERRAL) {
                isUnique = true;
            }
        }

        // Create user
        const user = await User.create({
            phone,
            password,
            plainPassword: password,
            referralCode: newReferralCode,
            referredBy: referralCode
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                phone: user.phone,
                referralCode: user.referralCode
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error creating user'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide phone and password'
            });
        }

        // Check for user phone
        const user = await User.findOne({ phone }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = generateToken(user._id);

        // Check if user is admin
        const ADMIN_PHONE = '03151251123';
        const isAdmin = user.phone === ADMIN_PHONE;

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                phone: user.phone,
                referralCode: user.referralCode,
                isAdmin: isAdmin
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error during login'
        });
    }
};

// @desc    Check if referral code exists
// @route   POST /api/auth/check-referral
// @access  Public
exports.checkReferral = async (req, res) => {
    try {
        const { referralCode } = req.body;

        // Check if referral code exists
        const user = await User.findOne({ referralCode });

        res.status(200).json({
            exists: !!user
        });
    } catch (error) {
        console.error('Check Referral Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error checking referral code'
        });
    }
}; 