const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(" ")[1];

        console.log("🔍 Received Token:", token); // ✅ Debugging: See if token is received

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Not authorized, no token",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded); // ✅ Debugging: Check token content

        const user = await User.findById(decoded.id).select("-password");
        console.log("👤 User Found:", user ? user.phone : "Not Found"); // ✅ Debugging: Check if user exists

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "User not found",
            });
        }

        req.user = user; // Attach user data to request
        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error.message); // ✅ Debugging: Log errors

        return res.status(401).json({
            status: "error",
            message: "Invalid token",
        });
    }
};

module.exports = { protect };
