# Blockchain course's project: DApp [Work in progress]

A decentralized application (DApp) demo with smart contracts, backend, and frontend architecture.
This guide explains how to set up and run the local blockchain with Hardhat.

---

# Local Blockchain Setup (Hardhat)

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

## Development Workflow

You can run each step manually or use the automated one-liner.

---

**Option A** – Manual step-by-step

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

**Option B** – One-liner (Recommended)

   ```bash
   npm run dev:full
   ```
   
   > This command:
   1. Generates wallets
   2. Opens a new terminal for the node
   3. Waits for the node to be ready
   4. Deploys all contracts

   It's cross-platform compatible and all data saved in `address_data/`

## Owner Account Handling

- When deploying, the address that executes the deployment becomes the owner (`msg.sender`).
- To maintain control, always deploy using your own key or wallet.
- To interact as the owner, use the same private key or unlock the account via a provider (e.g., MetaMask or `.env`).

---
---

# Backend Setup

1. Navigate to the `backend` directory

   ```bash
   cd backend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

## Running the Backend Server

   The backend server uses Express.js and connects to the local blockchain.

   ```bash
   npm start
   ```

   This will start the server at [http://localhost:5000](http://localhost:5000).

---
---

# Frontend Setup

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. Open a terminal and navigate to the `frontend` directory:

   ```sh
   cd frontend
   ```

2. Install the required dependencies:

   ```sh
   npm install
   ```

## Running the Development Server

Start the local development server with:

```sh
npm run dev
```

This will launch the app at [http://localhost:5173](http://localhost:5173) (or another port if 5173 is in use).

## Building for Production

To build the optimized production bundle:

```sh
npm run build
```

## Linting

To check for code style and errors:

```sh
npm run lint
```

## Preview Production Build

To preview the production build locally:

```sh
npm run preview
```
