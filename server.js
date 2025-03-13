const API_VERSION = "/api/v1";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const { validationResult } = require("express-validator");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { getUserEarnings, claimBonus } = require("./src/controllers/userControllers.js");
const { protect, adminProtect } = require("./src/middleware/auth.js");
const app = express();  // ✅ Initialize app first

const authRoutes = require('./src/routes/authRoutes.js');  // ✅ Import routes after app is initialized

// Then use routes
app.use("/api/v1", authRoutes);

// Temporary user storage (replace with MongoDB later)
const users = new Map();
const generateReferralCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Admin credentials
const ADMIN = {
    phone: process.env.ADMIN_PHONE || "03151251123", // Default for development
    password: process.env.ADMIN_PASSWORD || "admin123", // Default for development
    referralCode: process.env.ADMIN_REFERRAL || "123456", // Default for development
    role: "admin",
};

// Add admin to users Map
users.set(ADMIN.phone, ADMIN);

const connectDB = require("./config/db");

connectDB()
    .then(() => {
        console.log("✅ MongoDB connected successfully");
        isMongoConnected = true;
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err);
        isMongoConnected = false;
    });


// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*", // More permissive for development
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined")); // Request logging

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.body,
        query: req.query,
    });
    next();
});

// Serve static files from the public directory
app.use(express.static("public"));

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Centralized auth routes
app.use(`${API_VERSION}/auth`, async (req, res) => {
    if (req.path === "/signup") {
        const { phone, password, referralCode } = req.body;

        // Validate phone format
        if (!phone || !/^\d{11}$/.test(phone)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid phone number format",
            });
        }

        // Check if phone number is admin's
        if (phone === ADMIN.phone) {
            return res.status(400).json({
                status: "error",
                message: "This phone number cannot be used for registration",
            });
        }

        // Check if phone number is already registered
        if (users.has(phone)) {
            return res.status(400).json({
                status: "error",
                message: "This phone number is already registered",
            });
        }

        // Validate password format
        if (!password || !/^[A-Za-z0-9]{6,10}$/.test(password)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid password format",
            });
        }

        // Validate referral code
        if (!referralCode || !/^\d{6}$/.test(referralCode)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid referral code format",
            });
        }

        // Validate referral code
        const isAdminReferral = referralCode === ADMIN.referralCode;
        const referringUser = Array.from(users.values()).find(
            (user) => user.referralCode === referralCode
        );

        if (!isAdminReferral && !referringUser) {
            return res.status(400).json({
                status: "error",
                message: "Invalid referral code",
            });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newReferralCode = generateReferralCode();
        const newUser = {
            phone,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy: isAdminReferral ? "ADMIN" : referringUser.phone,
            role: "user",
        };

        // Store user
        users.set(phone, newUser);

        res.json({
            status: "success",
            message: "Signup successful",
            token: "test-token",
            role: "user",
            referralCode: newReferralCode,
        });
    } else if (req.path === "/login") {
        const { phone, password } = req.body;

        // Check if it's admin
        if (phone === ADMIN.phone) {
            // For development: direct password comparison
            if (password === ADMIN.password) {
                return res.json({
                    status: "success",
                    message: "Admin login successful",
                    token: "test-token",
                    role: "admin",
                });
            }
        }

        // Check if user exists
        const user = users.get(phone);
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid phone number or password",
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials",
            });
        }

        res.json({
            status: "success",
            message: "Login successful",
            token: "test-token",
            role: user.role,
        });
    } else if (req.path === "/check-phone") {
        const { phone } = req.query;
        res.json({
            status: "success",
            exists: users.has(phone) || phone === ADMIN.phone,
        });
    } else if (req.path === "/validate-referral") {
        const { code } = req.query;
        const isValid =
            code === ADMIN.referralCode ||
            Array.from(users.values()).some((user) => user.referralCode === code);
        res.json({
            status: "success",
            valid: isValid,
        });
    } else {
        res.status(404).json({
            status: "error",
            message: "Route not found",
        });
    }
});



// Redirect root to index.html
app.get("/", (req, res) => {
    res.redirect("/index.html");
});

// Middleware to check admin access
const checkAdminAccess = (req, res, next) => {
    // For testing purposes, we'll check the role from query parameter
    // In production, this should be done with proper JWT token verification
    const role = req.query.role;
    if (role !== "admin") {
        return res.redirect("/dashboard");
    }
    next();
};

// Admin panel routes (both with and without .html)
app.get(
    ["/admin", "/admin.html", "/admin-panel", "/admin-panel.html"],
    checkAdminAccess,
    (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin.html"));
    }
);

// Dashboard routes (both with and without .html)
app.get(["/dashboard", "/dashboard.html"], (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Add API endpoint for admin to fetch users
app.get("/api/v1/admin/users", (req, res) => {
    // In a real application, verify admin token here
    const usersList = Array.from(users.values())
        .filter((user) => user.role !== "admin") // Exclude admin from the list
        .map((user) => ({
            phone: user.phone,
            referralCode: user.referralCode,
            referredBy: user.referredBy,
        }));

    res.json({
        status: "success",
        users: usersList,
    });
});

// Add delete user endpoint
app.delete("/api/v1/admin/users/:phone", async (req, res) => {
    const { phone } = req.params;
    const { adminPassword } = req.body;

    // Verify admin password
    if (adminPassword !== ADMIN.password) {
        return res.status(401).json({
            status: "error",
            message: "Invalid admin password",
        });
    }

    // Don't allow deleting admin
    if (phone === ADMIN.phone) {
        return res.status(403).json({
            status: "error",
            message: "Cannot delete admin account",
        });
    }

    // Check if user exists
    if (!users.has(phone)) {
        return res.status(404).json({
            status: "error",
            message: "User not found",
        });
    }

    // Delete user
    users.delete(phone);

    res.json({
        status: "success",
        message: "User deleted successfully",
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Error:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        body: req.body,
        headers: req.headers,
    });

    const statusCode = err.statusCode || 500;
    const errorResponse = {
        status: "error",
        message:
            process.env.NODE_ENV === "production"
                ? "Something went wrong!"
                : err.message,
        requestId: req.id,
        code: err.code || "INTERNAL_ERROR",
    };

    if (process.env.NODE_ENV === "development") {
        errorResponse.stack = err.stack;
        errorResponse.details = err.details;
    }

    res.status(statusCode).json(errorResponse);
});

// Handle 404
app.use((req, res) => {
    console.log("404 Not Found:", req.path);
    if (req.accepts("html")) {
        res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
    } else {
        res.status(404).json({
            status: "error",
            message: "Route not found",
            code: "NOT_FOUND",
        });
    }
});
// ✅ Move server declaration above gracefulShutdown()
const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});

// ✅ Now server exists before gracefulShutdown() is called
const gracefulShutdown = () => {
    console.log("Received shutdown signal. Closing HTTP server...");
    server.close(() => {
        console.log("HTTP server closed");
        // Close MongoDB connection
        if (isMongoConnected) {
            mongoose.connection.close(false, () => {
                console.log("MongoDB connection closed");
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });

    // Force shutdown after 30 seconds if connections do not close
    setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 30000);
};

// Listen for shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);



// ✅ Normal users can access these
app.get("/api/v1/user/earnings", protect, getUserEarnings);
app.post("/api/v1/user/claim-bonus", protect, claimBonus);

// ✅ Only admin can access this
app.get("/api/v1/admin/users", protect, adminProtect, (req, res) => {
    // Admin-only logic here
});




