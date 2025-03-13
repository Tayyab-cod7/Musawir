const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: "majority",
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");

        if (usersCollection) {
            // Remove documents with null or invalid phone numbers
            const deleteResult = await usersCollection.deleteMany({
                $or: [{ phone: null }, { phone: { $exists: false } }, { phone: "" }],
            });
            if (deleteResult.deletedCount > 0) {
                console.log(`Cleaned up ${deleteResult.deletedCount} invalid user data entries.`);
            }

            // Ensure phone number index exists
            const indexes = await usersCollection.indexes();
            if (!indexes.some((index) => index.key.phone)) {
                await usersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true });
                console.log("Successfully created phone number index");
            }
        }

        // Test the connection
        await db.admin().ping();
        console.log("Database connection is active");
        return conn;
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        throw new Error("Failed to connect to MongoDB");
    }
};

module.exports = connectDB;
