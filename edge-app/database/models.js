const { connectDB } = require('./db.js');

/**
 * Retrieves the users collection.
 * @returns {Promise<Collection>} - Users collection
 */
async function getUsersCollection() {
    const db = await connectDB();
    return db.collection('users');
}

/**
 * Retrieves the wallets collection.
 * @returns {Promise<Collection>} - Wallets collection
 */
async function getWalletsCollection() {
    const db = await connectDB();
    return db.collection('wallets');
}

/**
 * Retrieves the ipfsKeys collection.
 * @returns {Promise<Collection>} - IPFS Keys collection
 */
async function getIPFSKeysCollection() {
    const db = await connectDB();
    return db.collection('ipfsKeys');
}

/**
 * Retrieves the authorization collection.
 * @returns {Promise<Collection>} - Authorization collection
 */
async function getAuthorizationCollection() {
    const db = await connectDB();
    return db.collection('authorization');
}

/**
 * Retrieves the pii collection.
 * @returns {Promise<Collection>} - PII collection
 */
async function getPIICollection() {
    const db = await connectDB();
    return db.collection('pii');
}

/**
 * Retrieves the phi collection.
 * @returns {Promise<Collection>} - PHI collection
 */
async function getPHICollection() {
    const db = await connectDB();
    return db.collection('phi');
}

/**
 * Retrieves the data collection.
 * @returns {Promise<Collection>} - Data collection
 */
async function getDataCollection() {
    const db = await connectDB();
    return db.collection('data');
}

/**
 * Inserts a new document into the ipfsKeys collection.
 * @param {Object} fileMetadata - Metadata of the file to store.
 * @returns {Promise<Object>} - The result of the insert operation.
 */
async function insertIPFSKey(fileMetadata) {
    const collection = await getIPFSKeysCollection();
    const result = await collection.insertOne(fileMetadata);
    return result;
}

/**
 * Retrieves a document from the ipfsKeys collection by fileId.
 * @param {number|string} fileId - The file ID to search for.
 * @returns {Promise<Object|null>} - The file metadata, or null if not found.
 */
async function getIPFSKeyByFileId(fileId) {
    const collection = await getIPFSKeysCollection();
    const result = await collection.findOne({ fileId });

    if (!result) {
        throw new Error(`File with ID ${fileId} not found`);
    }

    return result;
}

module.exports = {
    getUsersCollection,
    getWalletsCollection,
    getIPFSKeysCollection,
    insertIPFSKey,
    getIPFSKeyByFileId,
    getAuthorizationCollection,
    getPIICollection,
    getPHICollection,
    getDataCollection
};
