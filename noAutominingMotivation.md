### ⚠️ Why nonce issues occur with Hardhat + Ethers.js + Automining

This issue happens when sending multiple transactions from the same account in quick succession, even if you're using a queue. Here's a breakdown of the root cause:

1. When you call `tx.wait()`, the transaction is considered "confirmed" only once the block is mined. However...

2. **Ethers.js caches the nonce** internally and doesn't always immediately reflect the updated nonce from the chain, especially in fast environments.

3. With **Hardhat's automining enabled**, blocks are mined instantly after each transaction. But if your second transaction starts execution immediately after the first (before the block is fully visible to the provider), then the chain state seen by `getTransactionCount("latest")` is outdated.

4. As a result, `getTransactionCount("latest")` may return the **same nonce** as the previous transaction, and the second transaction fails with:

   ```
   Error: Nonce too low. Expected nonce to be X but got X.
   ```

### ✅ How to solve it

- Use `"pending"` instead of `"latest"` when calling `getTransactionCount(...)` to include pending txs:

  ```js
  provider.getTransactionCount(address, "pending");
  ```

- Or disable automining and manually mine a block after each tx:

  ```js
  await provider.send("evm_mine");
  ```

This ensures the nonce on-chain is truly updated before sending the next tx.
