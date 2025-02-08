import IPFSNode from './ipfsNode.js';

const main = async () => {
  const ipfsNode = new IPFSNode();
  await ipfsNode.initialize();

  // // Upload a file
  // const encoder = new TextEncoder();
  // // const fileData = encoder.encode('Hello, IPFS!');
  // // const cid = await ipfsNode.uploadBytes(fileData);

  // const ipfsNode1 = new IPFSNode();
  // await ipfsNode1.initialize();
  // // const downloadedData1 = await ipfsNode1.downloadBytes(cid);
  // // console.log('Downloaded file content:', downloadedData1);


  // // Upload a file
  // const cid1 = await ipfsNode.uploadFile('./BOOTSTRAP_URL.txt');
  // //download file
  // console.log(cid1);
  // await ipfsNode1.downloadFile(cid1, 'temp.txt');
  // console.log('success');

  
};

main().catch((err) => console.error(err));
