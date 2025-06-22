# Blockchain course's project: DApp [Work in progress]

A demo project showcasing a decentralized application (DApp) architecture with separate frontend and backend components. This repository contains the basic structure for building a blockchain-based application.

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

---
---

# Blockchain Setup

`hardhat.config.js` is set up to create 6 wallets: 1 master wallet for the backend and 5 wallets for the users.

```bash
cd blockchain_folder
npm init -y
npm install --save-dev hardhat
npx hardhat compile
npx hardhat node
```

In another terminal, deploy the contract:

```bash
cd blockchain_folder
npx hardhat run scripts/deploy.js --network localhost
```

---
---

# Backend Setup

```bash
cd backend
npm install
npm start
```

## Testing Mockup

```bash
cd backend/testing
```

### Testing Registration

Each user registration creates a wallet, linking to a pre-created Hardhat wallet.

```bash
node registration.js
```
