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
    getIPFSKeyByFileId
};
