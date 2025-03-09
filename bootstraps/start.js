import { createBootstrapNode as startEdgeNode } from './edge/bootstrapNode.js';
import { createBootstrapNode as startIpfsNode } from './ipfs/bootstrapNode.js';

const startNodes = async () => {
    try {
        await Promise.all([startEdgeNode(), startIpfsNode()]);
        console.log('Both bootstrap nodes started successfully');
    } catch (error) {
        console.error('Error starting bootstrap nodes:', error);
    }
};

startNodes();
