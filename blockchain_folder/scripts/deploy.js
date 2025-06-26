const hre = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deploying contracts with:", owner.address);

  // 1. Deploy UI Manager with owner address
  UIManager = await ethers.getContractFactory("SCV_UI_manager");
  uiManager = await UIManager.deploy(owner.address);
  await uiManager.waitForDeployment(); // Updated for ethers v6

  // 2. Deploy Storage Manager with UI manager as owner
  StorageManager = await ethers.getContractFactory("SCV_storage_manager");
  storageManager = await StorageManager.deploy(await uiManager.getAddress()); // Updated for ethers v6
  await storageManager.waitForDeployment(); // Updated for ethers v6

  // 3. Deploy Token Manager with UI manager as owner
  // constructor parameters: name, symbol, decimals, initial supply, UI manager address
  TokenManager = await ethers.getContractFactory("SCV_token_manager");
  tokenManager = await TokenManager.deploy(
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
  

  console.log("Token Manager:", tokenManager.address);
  console.log("Storage Manager:", storageManager.address);
  console.log("UI Manager:", uiManager.address);

  
  console.log("UI Manager deployed by:", uiManager.address);
  console.log("Token Manager deployed by:", tokenManager.address);
  console.log("Storage Manager deployed by:", storageManager.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});