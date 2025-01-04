import p2pNodeManager from './p2pNodeManager.js';
import { getIPFSKeysCollection } from '../database/models.js';

(async () => {
  try {
    // Insert a dummy document into the database
    const dummyFileId = 'dummyFile123';
    const dummyData = {
      fileId: dummyFileId,
      aesKey: 'dummyAESKey123',
      cid: 'dummyCID123',
    };

    const collection = await getIPFSKeysCollection();
    await collection.insertOne(dummyData);

    console.log('Inserted dummy document:', dummyData);

    // Create two P2P node managers
    const nodeManager1 =  new p2pNodeManager();
    const nodeManager2 = new p2pNodeManager();
    await nodeManager1.initialize();
    await nodeManager2.initialize()

    // Wait for both nodes to be initialized and started
    // await Promise.all([
    //   nodeManager1.initialize(),
    //   nodeManager2.initialize(),
    // ]);

    console.log('Node 1 multiaddress:', nodeManager1.p2pNode.getMultiaddrs());
    console.log('Node 2 multiaddress:', nodeManager2.p2pNode.getMultiaddrs());

    // // Node 2 will listen for incoming messages and log them
    // nodeManager2.p2pNode.setNodeListener((jsonData) => {
    //   console.log('Node 2 received JSON:', jsonData);
    // });

    // Node 1 sends a request to Node 2
    const file = await nodeManager1.sendRequest(
      await nodeManager2.p2pNode.getMultiaddrs(), // Receiver address
      dummyFileId // File ID to request
    );

    console.log(file);
    // Delay to allow for message processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Clean up: Delete the dummy document from the database
    await collection.deleteOne({ fileId: dummyFileId });
    console.log('Deleted dummy document with fileId:', dummyFileId);

    // Stop both nodes
    await Promise.all([
      nodeManager1.p2pNode.node.stop(),
      nodeManager2.p2pNode.node.stop(),
    ]);

    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error during test execution:', error);
  }
})();
