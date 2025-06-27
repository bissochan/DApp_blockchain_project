import { Contract, JsonRpcProvider, Wallet } from "ethers";
import fs from "fs";
import path from "path";
import wallets from "../utils/wallets.js";

// Load the first wallet as the master wallet
const provider = new JsonRpcProvider("http://127.0.0.1:8545");
const masterWallet = new Wallet(wallets[0].privateKey, provider);

// Load deployed contract addresses from file
const deployedPath = path.resolve("../blockchain_folder/address_data/deployedContract.json");
const deployed = JSON.parse(fs.readFileSync(deployedPath));

// Load contract artifact and instantiate Contract object
function loadContract(name, address) {
  const artifactPath = path.resolve(`../blockchain_folder/artifacts/smart_contracts/${name}.sol/${name}.json`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  return new Contract(address, artifact.abi, masterWallet);
}

// Extract contract addresses from the deployed JSON
const UIManager = loadContract("SCV_UI_manager", deployed.UIManager);
const TokenManager = loadContract("SCV_token_manager", deployed.TokenManager);
const StorageManager = loadContract("SCV_storage_manager", deployed.StorageManager);

export { masterWallet, StorageManager, TokenManager, UIManager };
