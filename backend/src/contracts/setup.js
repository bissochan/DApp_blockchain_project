import { Wallet } from "ethers";
import wallets from "../utils/wallets.js";
import { UIManager, masterWallet, provider } from "./contract.js";
import { enqueueTxForWallet } from "./txQueue.js";

export async function ensureDefaultCompanyWhitelisted() {
  const companyWallet = new Wallet(wallets[2].privateKey, provider);

  const isWhitelisted = await UIManager.isWhitelisted(companyWallet.address);
  if (isWhitelisted) {
    console.log(`✓ [INIT] Company already whitelisted: ${companyWallet.address}`);
    return;
  }

  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiConnected = UIManager.connect(masterWallet);
      return uiConnected.addWhiteListEntity(companyWallet.address, { nonce });
    });
    console.log(`✓ [INIT] Company successfully whitelisted: ${companyWallet.address}`);
  } catch (err) {
    console.error(`✖ [INIT] Failed to whitelist company: ${err.message}`);
  }
}
