import IPFSNode from './ipfsNode.js';

const main = async () => {
  const ipfsNode = new IPFSNode();
  await ipfsNode.initialize();

  // Upload a file
  const encoder = new TextEncoder();
  const fileData = encoder.encode('Hello, IPFS!');
  const cid = await ipfsNode.uploadFile(fileData);

  // Download the file
  const downloadedData = await ipfsNode.downloadFile(cid);
  console.log('Downloaded file content:', downloadedData);

   const ipfsNode1 = new IPFSNode();
   await ipfsNode1.initialize();
   const downloadedData1 = await ipfsNode1.downloadFile(cid);
  console.log('Downloaded file content:', downloadedData1);
};

main().catch((err) => console.error(err));
