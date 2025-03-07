const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load the variables
dotenv.config("./.env");

const url = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

let client;
let db;

/**
 * Connects to MongoDB and provides a database instance.
 * @returns {Promise<Db>} - MongoDB database instance
 */
async function connectDB() {
    if (db) {
        return db;
    }

    try {
        console.log(`Connecting to MongoDB at ${url}...`);
        client = new MongoClient(url);
        await client.connect();
        db = client.db(dbName);
        console.log(`Connected to MongoDB database: ${dbName}`);
        return db;
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }
}

/**
 * Disconnects from MongoDB.
 */
async function disconnectDB() {
    if (client) {
        await client.close();
        console.log('Disconnected from MongoDB.');
    }
}

module.exports = { connectDB, disconnectDB };
