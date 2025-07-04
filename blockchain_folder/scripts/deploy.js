import fs from "fs";
import hardhat from "hardhat";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const { ethers } = hardhat;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deploying contracts with:", owner.address);

  // 1. Deploy UI Manager with owner address
  const UIManager = await ethers.getContractFactory("SCV_UI_manager");
  const uiManager = await UIManager.deploy(owner.address);
  await uiManager.waitForDeployment();
  // 2. Deploy Storage Manager with UI manager as owner
  const StorageManager = await ethers.getContractFactory("SCV_storage_manager");
  const storageManager = await StorageManager.deploy(
    await uiManager.getAddress()
  );
  await storageManager.waitForDeployment();
  // 3. Deploy Token Manager with UI manager as owner
  // constructor parameters: name, symbol, decimals, initial supply, UI manager address
  const TokenManager = await ethers.getContractFactory("SCV_token_manager");
  const tokenManager = await TokenManager.deploy(
    "SCV Token",
    "SCVT",
    0,
    1000,
    await uiManager.getAddress()
  );
  await tokenManager.waitForDeployment();

  // 4. Link contracts to UI Manager
  const tx = await uiManager.setStorageManager(
    await storageManager.getAddress()
  );
  await tx.wait();
  const tx2 = await uiManager.setTokenManager(await tokenManager.getAddress());
  await tx2.wait();
  const deployedInfo = {
    UIManager: await uiManager.getAddress(),
    StorageManager: await storageManager.getAddress(),
    TokenManager: await tokenManager.getAddress(),
    Deployer: owner.address,
  };

  const outputDir = path.resolve(__dirname, "../address_data");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "deployedContract.json"),
    JSON.stringify(deployedInfo, null, 2)
  );

  console.log("Contracts deployed and saved to deployed.json:");
  console.log(deployedInfo);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
