# Medical Data Sharing

This project implements a blockchain-based edge computing and IPFS framework for secure and efficient medical data storage. It uses Docker Compose to easily spin up and manage the necessary services, including MongoDB, IPFS nodes, edge nodes and mongodb instances required for the framework.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Services](#services)
- [Docker Compose Commands](#docker-compose-commands)
- [License](#license)

## Project Overview

This project is designed to store medical data securely using Hyperledger Fabric, IPFS, and edge computing principles. The data is stored on IPFS nodes, and blockchain smart contracts ensure only authorized access to the data. MongoDB is used to store metadata and related information.

## Prerequisites

Before you begin, ensure that you have the following installed on your system:

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Git** (optional, for cloning the project): [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## Getting Started

### Clone the repository

```bash
git clone https://github.com/tharun-rs/medic-data-storage.git
cd medic-data-storage
```

### Build and start the services using Docker Compose

Run the following command to build and start the containers defined in `docker-compose.yml`:

```bash
docker-compose up --build
```

This will:

1. Start MongoDB for storing metadata.
2. Start IPFS nodes for decentralized file storage.
3. Set up any other services defined in the `docker-compose.yml` file, such as edge nodes and blockchain nodes.

### Accessing the services

- **MongoDB**: Available at `localhost:27017` (or the port defined in the `docker-compose.yml` file).
- **IPFS Node**: Accessible via the IPFS API at `localhost:4002`.

## Services

### MongoDB

MongoDB is used to store metadata for the medical data and related information. It is configured to persist data in the `mongo_data` volume.

### IPFS

The IPFS nodes are used for storing and sharing medical data files in a distributed manner. These nodes communicate with each other to ensure redundancy and availability.

### Edge Node

The edge node is responsible for handling the medical data processing on the edge of the network, interacting with IPFS and blockchain networks, and ensuring secure data storage and retrieval.

### Blockchain (Hyperledger Fabric, if applicable)

The blockchain is used for securing and authorizing access to medical data through smart contracts. It ensures that only authorized users can store and retrieve data from the IPFS network.

## Docker Compose Commands

Here are some common Docker Compose commands for managing the project:

- **Start the services**: 
  ```bash
  docker-compose up
  ```

- **Start services in the background** (detached mode):
  ```bash
  docker-compose up -d
  ```

- **Stop the services**:
  ```bash
  docker-compose down
  ```

- **View logs**:
  ```bash
  docker-compose logs
  ```

- **Rebuild the services** (e.g., after modifying Dockerfiles or dependencies):
  ```bash
  docker-compose up --build
  ```

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
