const User = require('../models/User');

// @desc    Get user earnings
// @route   GET /api/user/earnings
// @access  Private
exports.getUserEarnings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            earnings: user.earnings,
            bonusClaimed: user.bonusClaimed // Send bonus claim status to frontend
        });
    } catch (error) {
        console.error('Error fetching earnings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching earnings'
        });
    }
};

// @desc    Claim 150 RS signup bonus
// @route   POST /api/user/claim-bonus
// @access  Private
exports.claimBonus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // 🟢 Check if user has already claimed the bonus
        if (user.bonusClaimed) {
            return res.status(400).json({
                status: 'error',
                message: 'Bonus already claimed'
            });
        }

        // 🟢 Add 150 RS to earnings and mark bonus as claimed
        user.earnings += 150;
        user.bonusClaimed = true;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Bonus claimed successfully!',
            earnings: user.earnings
        });
    } catch (error) {
        console.error('Error claiming bonus:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error claiming bonus'
        });
    }
};

// @desc    Add 50 RS to the package and total earnings
// @route   POST /api/v1/user/earn-50
// @access  Private
exports.earn50 = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        // 🟢 Add 50 RS to both package and total earnings
        user.packageBalance = (user.packageBalance || 0) + 50;
        user.earnings += 50;

        await user.save();

        res.status(200).json({
            status: "success",
            message: "50 RS added successfully!",
            earnings: user.earnings,
            packageBalance: user.packageBalance
        });
    } catch (error) {
        console.error("Error adding earnings:", error);
        res.status(500).json({
            status: "error",
            message: "Error adding earnings"
        });
    }
};
