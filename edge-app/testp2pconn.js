import { createNode, setNodeListener, sendToNode } from './p2p_conn_configs/p2pNode.js'

const sender =  await createNode();
const recv = await createNode();

const func =  (jsonData) => {
    console.log(jsonData);
}

setNodeListener(recv, func);
const addresses = recv.getMultiaddrs().map((addr) => addr.toString());
sendToNode(sender, addresses[0], {msg:"hello"});