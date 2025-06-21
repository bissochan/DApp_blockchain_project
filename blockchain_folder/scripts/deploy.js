const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const UIManager = await hre.ethers.getContractFactory("SCV_UI_manager");

  // Pass deployer address as constructor argument (_owner)
  const uiManager = await UIManager.deploy(deployer.address);

  // ethers v6: wait for deployment
  await uiManager.waitForDeployment();

  console.log("SCV_UI_manager deployed to:", await uiManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => process.exit(0));
// This script deploys the SCV_UI_manager contract to the blockchain.
// It uses Hardhat's ethers.js library to handle the deployment process.
