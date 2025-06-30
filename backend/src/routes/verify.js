import { ethers } from "ethers";
import express from "express";
import { admins, certificates, companies, users } from "../../database.js";
import { TokenManager, UIManager, provider } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";
import { decryptObject } from "../utils/encrypt.js";
import { fakeIpfsCat } from "../utils/fakeIpfs.js";

const router = express.Router();

// Define the token amount required to verify a certificate
const TOKEN_PER_LOOKUP = ethers.parseUnits("10", 18); // 10 tokens

/**
 * POST /api/verify/verify_certificate
 * A verifier requests access to a certificate.
 * This involves paying tokens via the smart contract and retrieving decrypted data from fake IPFS.
 */
router.post("/verify_certificate", async (req, res) => {
  const { verifierUsername, certificateHash } = req.body;

  // 1. Check if verifier exists
  const verifier = users.find(u => u.username === verifierUsername) || companies.find(c => c.username === verifierUsername || admins.find(a => a.username === verifierUsername));
  if (!verifier) return res.status(404).json({ error: "Verifier not found" });

  // 2. Check if certificate exists
  const cert = certificates.find(c => c.certificateHash === certificateHash);
  if (!cert) return res.status(404).json({ error: "Certificate not found" });

  const verifierWallet = new ethers.Wallet(verifier.privateKey, provider);
  const balance = await TokenManager.balanceOf(verifierWallet.address);

  if (balance < TOKEN_PER_LOOKUP) {
    console.warn(`Insufficient balance for ${verifierUsername}: ${ethers.formatUnits(balance, 18)} tokens`);
    return res.status(400).json({
      error: "Insufficient token balance for verification"
    });
  }

  try {
    // 3. Approve UIManager to spend tokens
    await enqueueTxForWallet(verifierWallet, (nonce) => {
      const tokenConnected = TokenManager.connect(verifierWallet.connect(provider));
      return tokenConnected.approve(UIManager.target, TOKEN_PER_LOOKUP, { nonce });
    });

    // 4. Call getCertificateInfo (writes tx, emits event with CID)
    const uiConnected = UIManager.connect(verifierWallet.connect(provider));
    const tx = await uiConnected.getCertificateInfo(certificateHash);
    const receipt = await tx.wait();

    // 5. Parse logs to extract the CID from CertificateLookup event
    const event = receipt.logs
      .map(log => {
        try {
          return UIManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(log => log && log.name === "CertificateLookup");

    if (!event) {
      return res.status(500).json({ error: "CID not found in emitted logs" });
    }

    const parsed = /CID:\s*(\w+)/.exec(event.args.ipfsCid);
    if (!parsed || !parsed[1]) {
      return res.status(500).json({ error: "Invalid CID format in event" });
    }
    const cid = parsed[1];


    // 6. Retrieve encrypted data from fake IPFS
    let encrypted;
    try {
      encrypted = fakeIpfsCat(cid);
    } catch (e) {
      return res.status(500).json({ error: "CID not found in fake IPFS" });
    }

    // 7. Decrypt the data
    let decrypted;
    try {
      decrypted = decryptObject(encrypted);
    } catch (e) {
      return res.status(500).json({ error: "Failed to decrypt certificate data" });
    }

    // 8. Return verified certificate data
    const user = users.find(u => u.id === cert.userId);
    const company = companies.find(c => c.id === cert.companyId);

    if (user) decrypted.claim.user = user.username;
    if (company) decrypted.claim.company = company.username;

    delete decrypted.claim.userId; // Remove sensitive user ID from decrypted data
    delete decrypted.claim.companyId; // Remove sensitive company ID from decrypted data

    res.json({
      verified: true,
      certificate: decrypted
    });

    console.log(`Certificate verified successfully for ${verifierUsername}:`, {
      certificateHash,
      cid,
      decrypted
    });

  } catch (err) {
    console.error("Verification failed:", err);
    res.status(500).json({ error: "Verification failed", details: err.message });
  }
});

export default router;
