const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Check if user is admin (using the phone number)
            if (user.phone !== '03151251123') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to access admin routes'
                });
            }

            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        next(error);
    }
}; 