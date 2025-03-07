#!/bin/bash
# a wrapper script around the fabric samples test network for our specific use case
# Navigate to the testnetwork directory
cd blockchain/test-network

if [ "$1" == "up" ]; then
    # start the network
    ./network.sh up
    # create default channel
    ./network.sh createChannel
    # deploy chaincodes to channel
    ./network.sh deployCC -ccn auth -ccp ../chaincode/authorization-contract/ -ccl javascript
    ./network.sh deployCC -ccn data -ccp ../chaincode/data-upload-contract/ -ccl javascript
    ./network.sh deployCC -ccn phi -ccp ../chaincode/phi-access-request-contract/ -ccl javascript
    ./network.sh deployCC -ccn pii -ccp ../chaincode/pii-access-request-contract/ -ccl javascript
    

elif [ "$1" == "down" ]; then
    #bring down the network
    ./network.sh down


else
    echo "Usage: $0 {up|down}"
    exit 1
fi