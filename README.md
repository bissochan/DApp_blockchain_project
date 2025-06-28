# Blockchain course's project: DApp [Work in progress]

A demo project showcasing a decentralized application (DApp) architecture with separate frontend and backend components. This repository contains the basic structure for building a blockchain-based application.

# Blockchain Setup

`hardhat.config.js` is set up to create 6 wallets: 1 master wallet for the backend and 5 wallets for the users.

### 1. Navigate to the blockchain directory
```bash
cd blockchain_folder
```

### 2. Initialize a Node.js project (if not already)
```bash
npm init -y
```

### 3. Install Hardhat as a dev dependency
```bash
npm install --save-dev hardhat
```

### 4. Create a new Hardhat project
Choose "Create a JavaScript project" when prompted.

```bash
npx hardhat
```

### 5. Compile the smart contracts
Make sure your contracts are inside the `smart_contracts` directory (as configured in `hardhat.config.js`).

```bash
npx hardhat compile
```

### 6. Start the local Hardhat blockchain
```bash
npx hardhat node
```

This starts a local in-memory Ethereum node on `http://127.0.0.1:8545`.

If `wallets.json` is present and correctly formatted, it will be loaded automatically.  
You should see a message like:

```
Loaded 6 wallets from wallets.json
```

### 7. Deploy smart contracts to the local network
This command runs the `deploy.js` script and deploys your smart contracts to the running local Hardhat network.

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## 🔑 Owner Account Handling

- When deploying, the address that executes the deployment becomes the owner (`msg.sender`).
- To maintain control, always deploy using your own key or wallet.
- To interact as the owner, use the same private key or unlock the account via a provider (e.g., MetaMask or `.env`).

---
---

# Backend Setup

```bash
cd backend
npm install
npm start
```

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
