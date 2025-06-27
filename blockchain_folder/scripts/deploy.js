const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deploying contracts with:", owner.address);

  // 1. Deploy UI Manager with owner address
  const UIManager = await ethers.getContractFactory("SCV_UI_manager");
  const uiManager = await UIManager.deploy(owner.address);
  await uiManager.waitForDeployment(); // Updated for ethers v6

  // 2. Deploy Storage Manager with UI manager as owner
  const StorageManager = await ethers.getContractFactory("SCV_storage_manager");
  const storageManager = await StorageManager.deploy(await uiManager.getAddress()); // Updated for ethers v6
  await storageManager.waitForDeployment(); // Updated for ethers v6

  // 3. Deploy Token Manager with UI manager as owner
  // constructor parameters: name, symbol, decimals, initial supply, UI manager address
  const TokenManager = await ethers.getContractFactory("SCV_token_manager");
  const tokenManager = await TokenManager.deploy(
    "SCV Token",
    "SCVT",
    0,
    1000,
    await uiManager.getAddress() // Updated for ethers v6
  );
  await tokenManager.waitForDeployment(); // Updated for ethers v6

  // 4. Link contracts to UI Manager
  await uiManager.setStorageManager(await storageManager.getAddress()); // Updated for ethers v6
  await uiManager.setTokenManager(await tokenManager.getAddress()); // Updated for ethers v6


  const deployedInfo = {
    UIManager: await uiManager.getAddress(),
    StorageManager: await storageManager.getAddress(),
    TokenManager: await tokenManager.getAddress(),
    Deployer: owner.address
  };

  const deployedPath = path.resolve(__dirname, "../address_data/deployedContract.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deployedInfo, null, 2));

  console.log("Contracts deployed and saved to deployed.json:");
  console.log(deployedInfo);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});