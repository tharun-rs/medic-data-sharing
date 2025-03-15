Here’s your updated `README.md` with the requested changes:

---

# Medical Data Sharing

This project implements a blockchain-based edge computing and IPFS framework for secure and efficient medical data storage. It uses a simple command-line interface (`./system`) to manage services efficiently.


## Project Overview

This project is designed to store medical data securely using Hyperledger Fabric, IPFS, and edge computing principles. The data is stored on IPFS nodes, and blockchain smart contracts ensure only authorized access to the data. MongoDB is used to store metadata and related information.

## Prerequisites

Before you begin, ensure that you have the following installed on your system:

- **Git** (optional, for cloning the project): [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- **DOcker**, for running containers

## Getting Started

### Clone the repository

```bash
git clone https://github.com/tharun-rs/medic-data-storage.git
cd medic-data-storage
```

### Start the system

To bring up all services, run:

```bash
./system up
```

## Services

### MongoDB

MongoDB is used to store metadata for the medical data and related information.

### IPFS

The IPFS nodes are used for storing and sharing medical data files in a distributed manner.

### Edge Node

The edge node handles medical data processing, interacts with IPFS and blockchain networks, and ensures secure data storage and retrieval.

### Blockchain

The blockchain is used for securing and authorizing access to medical data through smart contracts.

## Managing the System

Use the following commands to control the system:

- **Start all services**:  
  ```bash
  ./system up
  ```

- **Stop all services**:  
  ```bash
  ./system down
  ```

- **Restart a specific service** (replace `<service>` with `edge` or `frontend`):  
  ```bash
  ./system restart <service>
  ```
