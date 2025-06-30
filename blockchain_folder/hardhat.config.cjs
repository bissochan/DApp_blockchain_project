require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");

const walletsPath = path.resolve(__dirname, "./address_data/wallets.json");
let wallets = [];

try {
  if (fs.existsSync(walletsPath)) {
    wallets = JSON.parse(fs.readFileSync(walletsPath));

    const isNodeCommand = process.argv[2] === "node";
    if (isNodeCommand) {
      console.log(`Loaded ${wallets.length} wallets from wallets.json`);
    }
  } else {
    console.warn("wallets.json file not found. Using default accounts.");
  }
} catch (e) {
  console.warn("Error reading wallets.json. Using default accounts.");
}

const hardhatAccounts = wallets.length > 0
  ? wallets.map(w => ({
    privateKey: w.privateKey,
    balance: typeof w.balance === "string" && w.balance.length > 0
      ? w.balance
      : "1000000000000000000000", // Default balance of 1000 ETH
  }))
  : undefined;

const privateKeysOnly = hardhatAccounts?.map(a => a.privateKey);

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: privateKeysOnly,
    },
    hardhat: {
      mining: {
        auto: false, // changed to true for testing porpuses
        interval: 100, // 500 ms
      },
      accounts: hardhatAccounts,
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
