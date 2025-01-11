import p2pNodeManager from './p2pNodeManager.js';
import { getIPFSKeysCollection } from '../database/models.js';

describe("P2P communication test", () => {
  let dummyFileId;
  let dummyData;
  let nodeManager1;
  let nodeManager2;
  let collection;

  beforeAll(async () => {
    // Insert a dummy document into the database
    dummyFileId = 'dummyFile123';
    dummyData = {
      fileId: dummyFileId,
      aesKey: 'dummyAESKey123',
      cid: 'dummyCID123',
    };

    collection = await getIPFSKeysCollection();
    await collection.insertOne(dummyData);

    // Create two P2P node managers
    nodeManager1 = new p2pNodeManager();
    nodeManager2 = new p2pNodeManager();
    await nodeManager1.initialize();
    await nodeManager2.initialize();

  });

  it("Fetching file metadata from other node", async () => {
    // Node 1 sends a request to Node 2
    const fileData = await nodeManager1.sendRequest(
      await nodeManager2.p2pNode.getMultiaddrs(), // Receiver address
      dummyFileId // File ID to request
    );
    expect(fileData.aesKey).toBe(dummyData.aesKey);
    expect(fileData.cid).toBe(dummyData.cid);
  });

  afterAll(async () => {
    // Clean up: Delete the dummy document from the database
    await collection.deleteOne({ fileId: dummyFileId });

    // Stop both nodes
    await Promise.all([
      nodeManager1.p2pNode.node.stop(),
      nodeManager2.p2pNode.node.stop(),
    ]);
  });
});
