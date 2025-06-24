# Smart Contracts Overview for Smart CV Project

## 1. `SCV_storage_manager.sol`

This contract manages the core on-chain storage of certificates.

- **Purpose:** Store and retrieve certificate metadata such as certificate hash, IPFS CID, and timestamp.
- **Key features:**
  - Only a designated manager address can add or query certificates.
  - Certificates are stored in a mapping keyed by their hash.
  - Returns a pseudo-ID generated from the hash of the CID.
  - Includes helper functions to convert uint and bytes32 values to strings for readable output.
  
- **Main functions:**
  - `addCertificate(string _cid, bytes32 _certHash)`: Adds a new certificate with its IPFS CID and hash.
  - `getCertificateInfoByHash(bytes32 _certHash)`: Retrieves certificate info by hash.

---

## 2. `SCV_token_manager.sol`

This contract implements an ERC-20 compatible token used as the platform’s utility token.

- **Purpose:** Manage token balances, transfers, minting, and burning.
- **Key features:**
  - Standard ERC-20 functionality (`transfer`, `approve`, `transferFrom`, etc.).
  - Minting and burning are restricted to the contract owner.
  - Token metadata (name, symbol, decimals) are set at deployment.
  
- **Main functions:**
  - `mint(address _account, uint256 _amount)`: Owner can create new tokens.
  - `burn(uint256 _amount)`: Owner can destroy tokens from their balance.
  - Standard ERC-20 functions for balance and allowance management.

---

## 3. `SCV_UI_manager.sol`

This contract acts as the frontend manager and gatekeeper for interactions with the certificate storage.

- **Purpose:** Manage the whitelist of authorized certifiers and act as an interface between users and the storage contract.
- **Key features:**
  - Only whitelisted entities can store certificates.
  - Only the owner can modify the whitelist or set the storage manager contract address.
  - Forwards certificate storage requests to the storage manager contract.
  - Provides query functions to check whitelist status and retrieve certificate info.
  
- **Main functions:**
  - `addWhiteListEntity(address _entity)`: Owner adds an authorized certifier.
  - `removeWhiteListEntity(address _entity)`: Owner removes a certifier.
  - `setStorageManager(address _storageManagerAddress)`: Owner sets the storage contract address.
  - `storeCertificate(address _entity, bytes32 _certificateHash, string _ipfsCid)`: Whitelisted entity stores a certificate.
  - `getCertificateInfo(bytes32 _certificateHash)`: Retrieve certificate info via storage manager.

---

# Summary

The system is designed with separation of concerns:

- `SCV_storage_manager` holds the certificate data on-chain.
- `SCV_token_manager` implements the utility token for payments and incentives.
- `SCV_UI_manager` controls access, manages authorized certifiers, and connects frontend requests to storage.

This modular approach ensures security, flexibility, and clear role delegation in the Smart CV platform.
