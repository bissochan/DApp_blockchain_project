# Blockchain course's project: DApp [Work in progress]

A decentralized application (DApp) demo with smart contracts, backend, and frontend architecture.
This guide explains how to set up and run the local blockchain with Hardhat.

---
# Project Structure

This repository is divided into three main parts: `backend/`, `blockchain_folder/`, and `frontend/`.

### Root Directory

Contains documentation and main folders for the DApp.
```
DApp_blockchain_project/
├── backend/                         # Express.js backend
│   ├── database.js                  # In-memory database
│   ├── index.js
│   ├── package.json
│   ├── fake_ipfs/                   # Simulated IPFS storage
│   │   └── <simulated IPFS files>   # (JSONs simulating CID content)
│   └── src/
│       ├── contracts/               # Blockchain interaction logic
│       │   ├── contract.js          # Loads contracts
│       │   ├── setup.js             # Setup default wallets
│       │   └── txQueue.js           # Nonce-safe queue for tx management
│       ├── routes/                  # REST API routes
│       │   ├── auth.js
│       │   ├── claims.js
│       │   ├── DB_queries.js
│       │   ├── token.js
│       │   └── verify.js
│       └── utils/                   # Utility functions
│           ├── encrypt.js
│           ├── fakeIpfs.js
│           └── wallets.js
├── blockchain_folder/               # Smart contract code, deployment scripts, tests
│   ├── hardhat.config.cjs
│   ├── package.json
│   ├── package-lock.json
│   ├── example.address_data/        # Example wallet and deployment data (for git)
│   ├── scripts/                     # Hardhat scripts
│   │   ├── deploy.js                # Deploys all contracts and links them
│   │   ├── wallet_generator.js      # Generates N wallets with ETH balances
│   │   └── wait-for-hardhat.js      # Waits for Hardhat node to be ready
│   ├── smart_contracts/
│   │   ├── SCV_UI_manager.sol       # Main interface contract for storing, whitelisting, etc.
│   │   ├── SCV_storage_manager.sol  # Stores certificate data (hash + CID)
│   │   └── SCV_token_manager.sol    # ERC20-like token for access control
│   └── test_smart_contracts/        # Solidity + JS tests for the contracts
├── frontend/                        # React.js frontend for the DApp
├── README.md
└── BlockChain_overview.pdf
```


# Setup Instructions
## Local Blockchain Setup (Hardhat)

1. Navigate to the `blockchain_folder`

   ```bash
   cd blockchain_folder
   ```

2. Install dependencies

   ```bash
   npm install
   ```
   > Installs: hardhat, ethers, and Hardhat plugins.
---

### Development Workflow

You can run each step manually or use the automated one-liner.

---

**Option A** – One-liner (Recommended)

   ```bash
   npm run dev:full
   ```
   
   > This command:
   1. Generates wallets
   2. Opens a new terminal for the node
   3. Waits for the node to be ready
   4. Deploys all contracts

   It's cross-platform compatible and all data saved in `address_data/`

**Option B** – Manual step-by-step

1. Generate wallets

   ```bash
   npm run generate-wallets
   ```

   > Creates address_data/wallets.json with:
   - 1 master wallet (high balance)
   - 19 user wallets (random smaller balances)

2. Start the local Hardhat node
   ```bash
   npm run start-node
   ```
   > Starts a local blockchain at http://127.0.0.1:8545.

3. Deploy smart contracts (in a new terminal)
   ```bash
   npm run deploy-contracts
   ```
    > Deploys:
    - SCV_UI_manager
    - SCV_storage_manager
    - SCV_token_manager

    > Output: address_data/deployedContract.json

---

## Backend Setup

1. Navigate to the `backend` directory

   ```bash
   cd backend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

### Running the Backend Server

   The backend server uses Express.js and connects to the local blockchain.

   When starting the local blockchain, wait (about 10 seconds are required) for the following files to appear in `blockchain_folder/address_data/` before proceeding:
   - wallets.json
   - deployedContract.json

   These contain the generated wallets and deployed contract addresses.
   Them, start the backend server with:

   ```bash
   npm start
   ```

   This will start the server at [http://localhost:5000](http://localhost:5000).
   After the server starts, it will automatically register and whitelist two predefined companies on-chain.
   
   ⚠️ **Check the logs to ensure two separate whitelist transactions are confirmed.**
   If either of the transactions fails, please restart the backend with:
   ```bash
   npm start
   ```

### Backend Testing

The backend includes automated tests written with Jest and Supertest. These tests validate the REST API functionality and simulate smart contract behavior using mocks.

All test files are located in:
```bash
backend/test
```

To run all tests:
```bash
cd backend
npm test
```

---

## Frontend Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Open a terminal and navigate to the `frontend` directory:

   ```sh
   cd frontend
   ```

2. Install the required dependencies:

   ```sh
   npm install
   ```

### Running the Development Server

Start the local development server with:

```sh
npm run dev
```

This will launch the app at [http://localhost:5173](http://localhost:5173) (or another port if 5173 is in use).

### Building for Production

To build the optimized production bundle:

```sh
npm run build
```

### Linting

To check for code style and errors:

```sh
npm run lint
```

### Preview Production Build

To preview the production build locally:

```sh
npm run preview
```
