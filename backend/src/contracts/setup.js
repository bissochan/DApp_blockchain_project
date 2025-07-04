import { Wallet } from "ethers";
import { companies, pendingWhitelistRequests, users } from "../../database.js";
import wallets from "../utils/wallets.js";
import { UIManager, masterWallet, provider } from "./contract.js";
import { enqueueTxForWallet } from "./txQueue.js";

export async function ensureDefaultCompanyWhitelisted() {
  const offset = users.length + 1; // Start from the index after all users

  for (const company of companies) {
    if (
      company.approvalStatus === "pending" &&
      !pendingWhitelistRequests.find((r) => r.companyId === company.id)
    ) {
      pendingWhitelistRequests.push({
        requestId: `req_${company.id}`,
        companyId: company.id,
        username: company.username,
        walletAddress: company.walletAddress,
      });
      console.log(`[INIT] Added pending request for: ${company.username}`);
    }
  }

  for (let i = 0; i < companies.length; i++) {
    const walletIndex = offset + i;
    const company = companies[i];

    if (company.approvalStatus !== "approved") {
      console.log(`[INIT] Skipping non-approved company: ${company.username}`);
      continue;
    }

    const companyWallet = new Wallet(wallets[walletIndex].privateKey, provider);
    const isWhitelisted = await UIManager.isWhitelisted(companyWallet.address);
    if (isWhitelisted) {
      console.log(
        `✓ [INIT] Company already whitelisted: ${company.username} (${companyWallet.address})`
      );
      continue;
    }

    try {
      await enqueueTxForWallet(masterWallet, (nonce) => {
        const uiConnected = UIManager.connect(masterWallet);
        return uiConnected.addWhiteListEntity(companyWallet.address, { nonce });
      });
      console.log(
        `✓ [INIT] Company whitelisted: ${company.username} (${companyWallet.address})`
      );
    } catch (err) {
      console.error(
        `✖ [INIT] Failed to whitelist ${company.username}: ${err.message}`
      );
    }
  }
}
