const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true,
        trim: true,
        match: [
            /^[0-9]{11}$/,
            'Please provide a valid 11-digit phone number'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    referralCode: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^[0-9]{6}$/,
            'Referral code must be 6 digits'
        ]
    },
    referredBy: {
        type: String,
        required: true,
        match: [
            /^[0-9]{6}$/,
            'Referral code must be 6 digits'
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    strict: true,
    strictQuery: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) {
            return next();
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Define indexes
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ referralCode: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User; 