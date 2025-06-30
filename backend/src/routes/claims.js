import { createHash } from "crypto";
import { ethers } from "ethers";
import express from "express";
import { certificates, companies, pendingClaims, users } from "../../database.js";
import { UIManager, provider } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";
import { encryptObject } from "../utils/encrypt.js";
import { fakeIpfsAdd } from "../utils/fakeIpfs.js";

const router = express.Router();
let nextClaimId = 1;

/**
 * POST /api/claim/create_claim
 * Candidate creates a new claim (experience request) to be approved by a company.
 */
router.post("/create_claim", async (req, res) => {
  console.log("Received claim creation request:", req.body);
  const { username, userId, company, companyName, role, startDate, endDate, description } = req.body;

  // Cerca l'utente tramite username o userId
  const user = users.find(u => u.username === (username || userId) || u.id === userId);
  if (!user) {
    console.error(`User not found: username=${username}, userId=${userId}`);
    return res.status(404).json({ error: "User not found" });
  }

  // Cerca l'azienda tramite company o companyName, verificando che sia whitelistata
  const companyObj = companies.find(c => c.username === (company || companyName) && c.approvalStatus === "approved");
  if (!companyObj) {
    console.error(`Company not found or not whitelisted: company=${company}, companyName=${companyName}`);
    return res.status(404).json({ error: "Company not found or not whitelisted" });
  }

  // Costruisci il claim
  const claim = {
    userId: user.id,
    companyId: companyObj.id,
    role,
    startDate,
    endDate,
    description,
    timestamp: Date.now(),
  };

  // Firma del claim da parte del candidato
  const claimString = JSON.stringify(claim);
  const userWallet = new ethers.Wallet(user.privateKey, provider);
  const userSignature = await userWallet.signMessage(claimString);

  // Aggiungi ai claim pendenti
  const claimId = `claim_${nextClaimId++}`;
  pendingClaims.push({
    claimId,
    claim,
    userSignature,
    status: "pending",
  });

  console.log("New claim created:", { claimId, claim, userSignature });
  res.json({ status: "claim_created", claimId });
});
/**
 * GET /api/claim/pending/:companyId
 * Return all pending claims for a specific company.
 */
router.get("/pending/:companyId", (req, res) => {
  const { companyId } = req.params;

  const company = companies.find(c => c.id === companyId);
  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  if (company.approvalStatus === "pending") {
    return res.status(403).json({ error: "Company approval is still pending" });
  }

  if (company.approvalStatus === "rejected") {
    return res.status(403).json({ error: "Company registration was rejected" });
  }

  const companyClaims = pendingClaims.filter(
    (c) => c.claim.companyId === companyId && c.status === "pending"
  );

  console.log("Pending claims for company:", companyId, companyClaims);
  res.json(companyClaims);
});

/**
 * POST /api/claim/approve_claim
 * Certifier approves a pending claim → signs, encrypts, uploads to IPFS, stores hash+CID on-chain.
 */
router.post("/approve_claim", async (req, res) => {
  const { companyUsername, claimId } = req.body;

  const claimEntry = pendingClaims.find((c) => c.claimId === claimId);
  if (!claimEntry || claimEntry.status !== "pending") {
    console.error("Claim not found or already processed:", claimId);
    console.error("Claim entry:", claimEntry);
    return res.status(404).json({ error: "Claim not found or already processed" });
  }

  const company = companies.find((c) => c.username === companyUsername);
  if (!company || company.id !== claimEntry.claim.companyId) {
    return res.status(403).json({ error: "Unauthorized approval attempt" });
  }

  // Firma del claim da parte dell'azienda
  const claimString = JSON.stringify(claimEntry.claim);
  const companyWallet = new ethers.Wallet(company.privateKey, provider);
  const certifierSignature = await companyWallet.signMessage(claimString);

  // Prepara il bundle criptato e carica su fake IPFS
  const claimBundle = {
    claim: claimEntry.claim,
    userSignature: claimEntry.userSignature,
    certifierSignature,
  };
  const encrypted = encryptObject(claimBundle);
  const cid = fakeIpfsAdd(encrypted);
  const certificateHash = "0x" + createHash("sha256").update(cid).digest("hex");

  console.log("CID:", cid);
  console.log("Hash:", certificateHash);

  // Salva on-chain usando il wallet dell'azienda
  await enqueueTxForWallet(companyWallet, (nonce) => {
    const uiConnected = UIManager.connect(companyWallet.connect(provider));
    return uiConnected.storeCertificate(companyWallet.address, certificateHash, cid, { nonce });
  });

  // Aggiorna lo stato del claim e salva il certificato
  claimEntry.status = "approved";
  certificates.push({
    certificateHash,
    cid,
    userId: claimEntry.claim.userId,
    companyId: claimEntry.claim.companyId,
  });

  console.log("Claim approved and certificate stored:", {
    claimId,
    certificateHash,
    cid,
  });
  res.json({
    status: "certificate_stored",
    certificateHash,
    cid,
  });
});

/**
 * POST /api/claim/reject_claim
 * Company rejects a pending claim. No on-chain interaction.
 */
router.post("/reject_claim", (req, res) => {
  const { companyUsername, claimId } = req.body;

  const claimEntry = pendingClaims.find((c) => c.claimId === claimId);
  if (!claimEntry || !claimEntry.claim) {
    return res.status(404).json({ error: "Claim not found" });
  }

  const company = companies.find((c) => c.username === companyUsername);
  if (!company || company.id !== claimEntry.claim.companyId) {
    return res.status(403).json({ error: "Unauthorized rejection attempt" });
  }

  claimEntry.status = "rejected";

  console.log("Claim rejected:", { claimId, companyUsername });
  res.json({
    status: "claim_rejected",
    claimId,
  });
});

export default router;