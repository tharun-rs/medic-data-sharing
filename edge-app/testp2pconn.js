import P2PNode from './p2pNode/p2pNode.js'

const sender =  new P2PNode;
const recv = new P2PNode;

await sender.initialize();
await recv.initialize();

const func =  (jsonData) => {
    console.log(jsonData);
}

recv.setNodeListener(func)
const addresses = recv.getMultiaddrs().map((addr) => addr.toString());
sender.sendToNode(addresses[0], {msg: "hello"});