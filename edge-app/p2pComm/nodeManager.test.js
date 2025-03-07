const p2pNodeManager = require('./p2pNodeManager');
const { getIPFSKeysCollection } = require('../database/models');

describe("P2P communication test", () => {
  let dummyFileId;
  let dummyData;
  let nodeManager1;
  let nodeManager2;
  let collection;

  beforeAll(async () => {
    console.log("⏳ Setting up test environment...");

    // Insert a dummy document into the database
    dummyFileId = 'dummyFile123';
    dummyData = {
      fileId: dummyFileId,
      aesKey: 'dummyAESKey123',
      cid: 'dummyCID123',
    };

    collection = await getIPFSKeysCollection();
    await collection.insertOne(dummyData);
    console.log("✅ Dummy data inserted into the database:", dummyData);

    // Create two P2P node managers
    nodeManager1 = new p2pNodeManager();
    nodeManager2 = new p2pNodeManager();

    console.log("⏳ Initializing P2P nodes...");
    await nodeManager1.initialize();
    await nodeManager2.initialize();
    console.log("✅ P2P nodes initialized.");
  });

  it("fetches file metadata from another node", async () => {
    console.log("📡 Node 1 requesting file metadata from Node 2...");
    
    const receiverAddress = await nodeManager2.p2pNode.getMultiaddrs();
    console.log("➡️ Sending request to:", receiverAddress);

    // Node 1 sends a request to Node 2
    const fileData = await nodeManager1.sendRequest(receiverAddress, dummyFileId);
    
    console.log("📥 Response received from Node 2:", fileData);

    // Assertions
    expect(fileData.aesKey).toBe(dummyData.aesKey);
    expect(fileData.cid).toBe(dummyData.cid);
    
    console.log("✅ Test passed: Received correct file metadata.");
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up test environment...");

    // Delete the dummy document from the database
    await collection.deleteOne({ fileId: dummyFileId });
    console.log("✅ Dummy data removed from the database.");

    // Stop both nodes
    console.log("⏳ Stopping P2P nodes...");
    await Promise.all([
      nodeManager1.p2pNode.node.stop(),
      nodeManager2.p2pNode.node.stop(),
    ]);
    console.log("✅ P2P nodes stopped.");
  });
});
