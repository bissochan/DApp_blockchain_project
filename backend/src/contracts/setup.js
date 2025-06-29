import { Wallet } from "ethers";
import { companies, users } from "../../database.js";
import wallets from "../utils/wallets.js";
import { UIManager, masterWallet, provider } from "./contract.js";
import { enqueueTxForWallet } from "./txQueue.js";

export async function ensureDefaultCompanyWhitelisted() {
  const offset = users.length + 1; // Start from the index after all users

  for (let i = 0; i < companies.length; i++) {
    const walletIndex = offset + i;
    const company = companies[i];
    const companyWallet = new Wallet(wallets[walletIndex].privateKey, provider);

    const isWhitelisted = await UIManager.isWhitelisted(companyWallet.address);
    if (isWhitelisted) {
      console.log(`✓ [INIT] Company already whitelisted: ${company.username} (${companyWallet.address})`);
      continue;
    }

    try {
      await enqueueTxForWallet(masterWallet, (nonce) => {
        const uiConnected = UIManager.connect(masterWallet);
        return uiConnected.addWhiteListEntity(companyWallet.address, { nonce });
      });
      console.log(`✓ [INIT] Company whitelisted: ${company.username} (${companyWallet.address})`);
    } catch (err) {
      console.error(`✖ [INIT] Failed to whitelist ${company.username}: ${err.message}`);
    }
  }
}
