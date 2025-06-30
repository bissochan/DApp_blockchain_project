const queues = new Map();
const nonceCache = new Map();

export function enqueueTxForWallet(wallet, fnFactory) {
  const address = wallet.address.toLowerCase();

  if (!queues.has(address)) {
    queues.set(address, Promise.resolve());
  }

  const provider = wallet.provider;
  if (!provider) throw new Error("Wallet has no provider");

  const queue = queues.get(address);

  const txPromise = queue.then(async () => {
    console.log(`→ Executing tx for wallet ${address}`);

    // Initialize nonceCache for this wallet if not yet done
    if (!nonceCache.has(address)) {
      const onChainNonce = await provider.getTransactionCount(address, "latest");
      nonceCache.set(address, onChainNonce);
    }

    // Get and increment nonce locally
    const nonce = nonceCache.get(address);
    nonceCache.set(address, nonce + 1);

    console.log("Using nonce:", nonce);

    try {
      const tx = await fnFactory(nonce);
      console.log("Transaction created:", tx.hash);

      // Mine a block if using a local chain (optional, adjust if using real chain)
      await provider.send("evm_mine", []);
      
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed or not mined");
      }

      console.log("✓ Tx successful:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      // Rollback nonce on failure
      nonceCache.set(address, nonce);
      throw error;
    }
  });

  // Update the queue to include this tx
  queues.set(address, txPromise.catch(() => {}));

  return txPromise;
}
