import p2pNode from './p2pNode.js'; // Import your existing P2PNode class

class p2pNodeManager {
  constructor() {
    // Create a new P2PNode instance
    this.p2pNode = new p2pNode();

    //  Initialize the node
    this.p2pNode.initialize();

    // Bind the `sendResponse` method to the P2PNode instance
    this.p2pNode.setNodeListener(this.sendResponse.bind(this));
  }

  /**
   * Method to handle incoming JSON data
   * This will be called whenever a message is received by the P2PNode.
   * @param {JSON} jsonData The incoming JSON data
   */
  sendResponse(jsonData) {
  }

  /**
   * Sends a request to another peer
   * @param {String} receiverAddr Multiaddress of the peer to send the request to
   * @param {String} fileId FileID of the file to be requested
   */
  async sendRequest(receiverAddr, fileId) {
  }

}

export default p2pNodeManager;
