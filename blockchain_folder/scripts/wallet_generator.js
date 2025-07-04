import { Wallet, parseEther } from "ethers";
import fs from "fs";
import path from "path";

const outputDir = path.resolve("address_data");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const N = 20; // Number of wallets to generate
const wallets = [];

for (let i = 0; i < N; i++) {
  const wallet = Wallet.createRandom();

  // Balance logic:
  const balance =
    i === 0
      ? parseEther("50000").toString() // 50.000 ETH to wallet[0] (master  wallet)
      : parseEther((Math.random() * 20 + 1).toFixed(4)).toString(); // 1–21 ETH randomly to others

  wallets.push({
    address: wallet.address,
    privateKey: wallet.privateKey,
    balance,
  });
}

const outputPath = path.join(outputDir, "wallets.json");
fs.writeFileSync(outputPath, JSON.stringify(wallets, null, 2));

console.log(`✅ Generated ${N} wallets with balances:`);
wallets.forEach((w, i) => {
  console.log(`${i}: Address=${w.address} | Balance=${w.balance}`);
});
