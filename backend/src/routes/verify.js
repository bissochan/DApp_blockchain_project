import { ethers } from "ethers";
import express from "express";
import { admins, certificates, companies, users } from "../../database.js";
import { TokenManager, UIManager, provider } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";
import { decryptObject } from "../utils/encrypt.js";
import { fakeIpfsCat } from "../utils/fakeIpfs.js";

const router = express.Router();

// Define the token amount required to verify a certificate
const TOKEN_PER_LOOKUP = 10n; // 10 tokens

/**
 * POST /api/verify/verify_certificate
 * A verifier requests access to a certificate.
 * This involves paying tokens via the smart contract and retrieving decrypted data from fake IPFS.
 */
router.post("/verify_certificate", async (req, res) => {
  const { verifierUsername, certificateHash } = req.body;

  // 1. Check if verifier exists
  const verifier =
    users.find((u) => u.username === verifierUsername) ||
    companies.find((c) => c.username === verifierUsername) ||
    admins.find((a) => a.username === verifierUsername);
  if (!verifier) return res.status(404).json({ error: "Verifier not found" });

  // 2. Check if certificate exists
  const cert = certificates.find((c) => c.certificateHash === certificateHash);
  if (!cert) return res.status(404).json({ error: "Certificate not found" });

  try {
    const verifierWallet = new ethers.Wallet(verifier.privateKey, provider);
    const balanceBigInt = await TokenManager.balanceOf(verifierWallet.address);

    if (balanceBigInt < TOKEN_PER_LOOKUP) {
      throw new Error("Insufficient token balance for verification");
    }

    // 3. Approve UIManager to spend tokens
    await enqueueTxForWallet(verifierWallet, (nonce) => {
      const tokenConnected = TokenManager.connect(
        verifierWallet.connect(provider)
      );
      return tokenConnected.approve(UIManager.target, TOKEN_PER_LOOKUP, {
        nonce,
      });
    });

    // 4. Call getCertificateInfo (writes tx, emits event with CID)
    const receipt = await enqueueTxForWallet(verifierWallet, (nonce) => {
      const uiConnected = UIManager.connect(verifierWallet.connect(provider));
      return uiConnected.getCertificateInfo(certificateHash, { nonce });
    });

    // 5. Parse logs to extract the CID from CertificateLookup event
    const event = receipt.logs
      .map((log) => {
        try {
          return UIManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log && log.name === "CertificateLookup");

    if (!event) {
      throw new Error("CID not found in emitted logs");
    }

    const parsed = /CID:\s*(\w+)/.exec(event.args.ipfsCid);
    if (!parsed || !parsed[1]) {
      throw new Error("Invalid CID format in event");
    }
    const cid = parsed[1];

    // 6. Retrieve encrypted data from fake IPFS
    const encrypted = fakeIpfsCat(cid);

    // 7. Decrypt the data
    const decrypted = decryptObject(encrypted);

    // 8. Return verified certificate data
    const user = users.find((u) => u.id === cert.userId);
    const company = companies.find((c) => c.id === cert.companyId);

    if (user) decrypted.claim.user = user.username;
    if (company) decrypted.claim.company = company.username;

    delete decrypted.claim.userId;
    delete decrypted.claim.companyId;

    res.json({
      verified: true,
      certificate: decrypted,
    });

    console.log(`Certificate verified successfully for ${verifierUsername}:`, {
      certificateHash,
      cid,
      decrypted,
    });
  } catch (err) {
    console.error("Verification failed:", err);
    res.status(500).json({
      error: "Verification failed",
      details: err.message || String(err),
    });
  }
});

export default router;
