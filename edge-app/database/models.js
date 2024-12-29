import { connectDB } from './db.js';

/**
 * Retrieves the `users` collection.
 * @returns {Promise<Collection>} - Users collection
 */
export async function getUsersCollection() {
    const db = await connectDB();
    return db.collection('users');
}

/**
 * Retrieves the `wallets` collection.
 * @returns {Promise<Collection>} - Wallets collection
 */
export async function getWalletsCollection() {
    const db = await connectDB();
    return db.collection('wallets');
}

/**
 * Retrieves the `ipfsKeys` collection.
 * @returns {Promise<Collection>} - IPFS Keys collection
 */
export async function getIPFSKeysCollection() {
    const db = await connectDB();
    return db.collection('ipfsKeys');
}
