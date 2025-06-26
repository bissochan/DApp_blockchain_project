# Building a Hardhat Network for Smart Contracts

This guide walks you through setting up a Hardhat network, deploying smart contracts, and connecting to them from both frontend and backend.

---

## 1. **Set Up a Hardhat Project**

1. **Initialize a Node.js project:**

   ```bash
   npm init -y
   ```

2. **Install Hardhat:**

   ```bash
   npm install --save-dev hardhat
   ```

3. **Create a Hardhat project:**

   ```bash
   npx hardhat
   ```

   Choose `Create a JavaScript project` and follow the prompts.

4. **Navigate to your Hardhat directory (if not already):**

   ```bash
   cd blockchain_folder
   ```

   Your smart contracts should be placed in:

   ```
   blockchain_folder/contracts/
   ```

   Example contracts:
   - `contracts/SCV_storage_manager.sol`
   - `contracts/SCV_UI_manager.sol`
   - `contracts/SCV_token_manager.sol`

---

## 2. **Configure Network (optional for testnets or custom networks)**

Edit `hardhat.config.js` to add networks if needed (e.g., for Goerli or localhost):

```js
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

---

## 3. **Compile Contracts**

```bash
npx hardhat compile
```

---

## 4. **Deploy Contracts**
Run the script:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Or for Hardhat Network (in-process):

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## 5. **Example Frontend/Backend Connection (Web3/ethers.js)**

To connect to the deployed contracts in a frontend or backend app:

### Load a Contract from ABI:

```js
import { ethers } from "ethers";
import UIManagerABI from "./abis/UIManager.json"; // Export ABI after compilation

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(); // Will use the first account

const uiManager = new ethers.Contract(
  "0xYourUIManagerAddress",
  UIManagerABI.abi,
  signer
);
```

Now you can call contract methods:

```js
await uiManager.storeCertificate(userAddress, "certificateHash", "ipfsCid");
```

If you need to impersonate a deployed account (e.g., frontend uses MetaMask):

```js
const userSigner = provider.getSigner(userIndex);
const contractWithUser = uiManager.connect(userSigner);
await contractWithUser.storeCertificate(...);
```

---

## 🔑 Owner Account Handling

- When deploying, the address that executes the deployment becomes the owner (`msg.sender`).
- To maintain control, always deploy using your own key or wallet.
- To interact as the owner, use the same private key or unlock the account via a provider (e.g., MetaMask or `.env`).

---

## ✅ Summary

- **Build the network:** Run `npx hardhat node` to start a local blockchain.
- **Deploy contracts:** Use a deploy script; the deployer becomes the contract owner.
- **Set managers:** Call `setStorageManager` and `setTokenManager` from `UIManager`.
- **Frontend/backend interaction:** Use `ethers.Contract` with the correct ABI, address, and signer.
- **Owner access:** Ensure you're using the deployer account to access privileged functions.

---