const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        try {
            const collections = await mongoose.connection.db.collections();
            const usersCollection = collections.find(collection => collection.collectionName === 'users');
            
            if (usersCollection) {
                // Drop all existing indexes
                await usersCollection.dropIndexes();
                console.log('Successfully dropped all indexes');

                // Remove documents with null or invalid phone numbers
                await usersCollection.deleteMany({
                    $or: [
                        { phone: null },
                        { phone: { $exists: false } },
                        { phone: "" }
                    ]
                });
                console.log('Successfully cleaned up invalid user data');
                
                // Create new index on phone number
                await usersCollection.createIndex({ phone: 1 }, { 
                    unique: true,
                    sparse: true // This ensures that documents with no phone field don't cause index conflicts
                });
                console.log('Successfully created phone number index');
            }
        } catch (indexError) {
            console.error('Index operation error:', indexError);
            // Continue execution even if index operations fail
        }

        // Test the connection
        await mongoose.connection.db.admin().ping();
        console.log('Database connection is active');
        return conn;
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        if (error.name === 'MongoServerError') {
            console.error('MongoDB Server Error. Please check your connection string and credentials.');
        }
        process.exit(1);
    }
};

module.exports = connectDB; 