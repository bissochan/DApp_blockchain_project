const queues = new Map();

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

    const nonce = await provider.getTransactionCount(address, "pending");
    console.log("Current nonce:", nonce);

    const tx = await fnFactory(nonce);
    console.log("Transaction created:", tx.hash);

    await provider.send("evm_mine", []);
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed or not mined");
    }

    console.log("✓ Tx successful:", receipt.hash);
    return receipt;
  });

  queues.set(address, txPromise.catch(() => {})); // Catch per evitare blocchi futuri

  return txPromise;
}
