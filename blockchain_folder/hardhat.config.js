require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");

// Read wallets.json
const walletsPath = path.resolve(__dirname, "wallets.json");
let wallets = [];

try {
  wallets = JSON.parse(fs.readFileSync(walletsPath));
} catch (e) {
  console.warn("Impossible to read wallets.json, using default accounts.");
}

// Consider only the private keys from the wallets
const accounts = wallets.length > 0
  ? wallets.map(w => ({
    privateKey: w.privateKey,
    balance: typeof w.balance === "string" && w.balance.length > 0
      ? w.balance
      : "10000000000000000000"  // 10 ETH di default come stringa
  }))
  : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: wallets.length > 0
        ? wallets.map(w => w.privateKey)  // solo stringhe!
        : undefined,
    },
    hardhat: {
      accounts: wallets.length > 0
        ? wallets.map(w => ({
          privateKey: w.privateKey,
          balance: w.balance || "10000000000000000000",
        }))
        : undefined,
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  paths: {
    sources: "./smart_contracts",
    tests: "./test_smart_contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  }
};
