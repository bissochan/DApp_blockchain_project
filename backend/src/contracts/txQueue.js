import { masterWallet } from "./contract.js";

const provider = masterWallet.provider;
if (!provider) {
  throw new Error("masterWallet has no provider attached");
}

let txQueue = Promise.resolve();

export function enqueueMasterTx(fnFactory) {
  const txPromise = txQueue.then(async () => {
    console.log("→ Executing transaction...");

    const nonce = await provider.getTransactionCount(masterWallet.address, "latest");
    console.log("Current nonce:", nonce);

    const tx = await fnFactory(nonce);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      console.error("✖ Transaction failed with status:", receipt.status);
      throw new Error("Transaction failed");
    }

    console.log("✓ Transaction successful:", receipt.hash);
    return receipt;
  });

  txQueue = txPromise.catch((err) => {
    console.warn("⚠ Transaction in queue failed:", err.message);
  });

  return txPromise;
}
