const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d", // Token expires in 30 days
    });
};

// Ensure admin user exists
const ensureAdminExists = async () => {
    try {
        const adminPhone = "03151251123";
        const adminExists = await User.findOne({ phone: adminPhone });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await User.create({
                phone: adminPhone,
                password: hashedPassword,
                referralCode: "000000",
                referredBy: "000000",
                earnings: 0, // Admin starts with 0 earnings
            });
            console.log("Admin user created successfully");
        }
    } catch (error) {
        console.error("Error ensuring admin exists:", error);
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
                status: "error",
                message: "Please provide all required fields",
            });
        }

        // Prevent registration with admin phone number
        const ADMIN_PHONE = "03151251123";
        if (phone === ADMIN_PHONE) {
            return res.status(403).json({
                status: "error",
                message: "This phone number is reserved",
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ phone });
        if (userExists) {
            return res.status(400).json({
                status: "error",
                message: "Phone number already registered",
            });
        }

        // Check if referral code exists or is admin code
        const ADMIN_REFERRAL = "000000";
        if (referralCode !== ADMIN_REFERRAL) {
            const referringUser = await User.findOne({ referralCode: referralCode });
            if (!referringUser) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid referral code",
                });
            }
        }

        // Generate unique referral code for new user
        let newReferralCode;
        let isUnique = false;
        while (!isUnique) {
            newReferralCode = Math.floor(100000 + Math.random() * 900000).toString();
            const exists = await User.findOne({ referralCode: newReferralCode });
            if (!exists && newReferralCode !== ADMIN_REFERRAL) {
                isUnique = true;
            }
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🟢 Create user with 150 RS earnings by default
        const user = await User.create({
            phone,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy: referralCode,
            earnings: 150, // 🟢 New users get 150 RS automatically
        });

        // Generate token
       // Generate a real token
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
});

res.json({
    status: "success",
    message: "Signup successful",
    token, // ✅ Now sending correct JWT
    user: {
        id: user._id,
        phone: user.phone,
        referralCode: user.referralCode,
        earnings: user.earnings,
    },
});

        
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Error creating user",
        });
    }
};

// @desc    User login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                status: "error",
                message: "Please provide phone and password",
            });
        }

        // Find user by phone
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials",
            });
        }

        // Compare hashed passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials",
            });
        }

      // Generate a real token
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
});

res.json({
    status: "success",
    message: "Login successful",
    token, // ✅ Now sending correct JWT
    user: {
        id: user._id,
        phone: user.phone,
        referralCode: user.referralCode,
        earnings: user.earnings,
    },
});

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            status: "error",
            message: "Error logging in",
        });
    }
};

// @desc    Check referral code validity
// @route   POST /api/auth/check-referral
// @access  Public
exports.checkReferral = async (req, res) => {
    try {
        const { referralCode } = req.body;

        if (!referralCode) {
            return res.status(400).json({
                status: "error",
                message: "Referral code is required",
            });
        }

        // Check if referral code exists
        const isValid = await User.findOne({ referralCode });

        res.json({
            status: "success",
            valid: !!isValid,
        });
    } catch (error) {
        console.error("Check Referral Error:", error);
        res.status(500).json({
            status: "error",
            message: "Error checking referral code",
        });
    }
};
