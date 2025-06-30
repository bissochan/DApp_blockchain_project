import { ethers } from "ethers";
import express from "express";
import { admins, companies, users, pendingWhitelistRequests } from "../../database.js";
import { masterWallet, UIManager } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";
import wallets from "../utils/wallets.js";

const router = express.Router();

// Wallet index management
let walletIndex = users.length + companies.length + 1; // Skip wallet[0] as it's the master wallet
let nextUserId = users.length;
let nextCompanyId = companies.length;
let nextWhitelistRequestId = 1;

// Assign the next available wallet from preloaded ones
function getNextWallet() {
  if (walletIndex >= wallets.length) {
    throw new Error("No more preassigned wallets available");
  }
  const w = wallets[walletIndex];
  walletIndex++;
  return w;
}

/**
 * POST /api/auth/register/candidate
 */
router.post("/register/candidate", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  let assignedWallet;
  try {
    assignedWallet = getNextWallet();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  users.push({
    id: `user${nextUserId++}`,
    username,
    role: "candidate",
    walletAddress: ethers.getAddress(assignedWallet.address),
    privateKey: assignedWallet.privateKey,
  });

  console.log("Candidate registered:", username);
  res.status(201).json({
    message: "Candidate registered",
    walletAddress: assignedWallet.address,
  });
});

/**
 * POST /api/auth/register/company
 */
router.post("/register/company", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  if (companies.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  let assignedWallet;
  try {
    assignedWallet = getNextWallet();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }


  // Check if already whitelisted (avoid double registration)
  const isWhitelisted = await UIManager.isWhitelisted(assignedWallet.address);
  if (isWhitelisted) {
    console.log("Company already whitelisted on-chain. Registration failed:", username);
    return res.status(400).json({ error: "Company already whitelisted on-chain" });
  }

  // Save company info off-chain
  const companyId = `company${nextCompanyId++}`;

  companies.push({
    id: companyId,
    username,
    role: "company",
    approvalStatus: "pending",
    walletAddress: ethers.getAddress(assignedWallet.address),
    privateKey: assignedWallet.privateKey,
    wasWorker: false, // Nuovo flag per tracciare se era un lavoratore
  });


  pendingWhitelistRequests.push({
    requestId: `req_${Date.now()}`,
    companyId,
    username,
  });

  console.log("Company registered and awaiting approval:", username);

  res.status(201).json({
    message: "Company registration submitted. Awaiting approval.",
    walletAddress: assignedWallet.address,
  });
});

/**

 * GET /api/auth/pending_whitelist_requests
 * Return all pending whitelist requests.
 */
router.get("/pending_whitelist_requests", (req, res) => {
  const pending = pendingWhitelistRequests.map((req) => {
    const company = companies.find((c) => c.id === req.companyId);
    return {
      requestId: req.requestId,
      companyId: req.companyId,
      username: req.username,
      walletAddress: company?.walletAddress || "",
    };
  });
  res.json(pending);
});

/**
 * POST /api/auth/approve_whitelist

 * Approve a pending whitelist request and whitelist the company on-chain.
 * Body: { requestId }
 */
router.post("/approve_whitelist", async (req, res) => {
  const { requestId } = req.body;
  const request = pendingWhitelistRequests.find((r) => r.requestId === requestId);
  if (!request) return res.status(404).json({ error: "Request not found" });

  const company = companies.find((c) => c.id === request.companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  // Whitelist on-chain using master wallet
  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiManagerConnected = UIManager.connect(masterWallet);
      return uiManagerConnected.addWhiteListEntity(company.walletAddress, { nonce });
    });

    company.approvalStatus = "approved";
    const index = pendingWhitelistRequests.findIndex((r) => r.requestId === requestId);
    pendingWhitelistRequests.splice(index, 1);

    console.log("Approved and whitelisted company:", company.username);
    res.status(200).json({ message: "Company approved and whitelisted." });
  } catch (err) {
    console.error("Error during whitelisting:", err);
    res.status(500).json({ error: "Blockchain transaction failed", details: err.message });

  }
});

/**
 * POST /api/auth/reject_whitelist

 * Reject a pending whitelist request.
 * Body: { requestId }
 */
router.post("/reject_whitelist", (req, res) => {
  const { requestId } = req.body;
  const requestIndex = pendingWhitelistRequests.findIndex((r) => r.requestId === requestId);

  if (requestIndex === -1) return res.status(404).json({ error: "Request not found" });

  const request = pendingWhitelistRequests[requestIndex];
  const company = companies.find((c) => c.id === request.companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  company.approvalStatus = "rejected";
  pendingWhitelistRequests.splice(requestIndex, 1);

  console.log("Rejected whitelist request for:", company.username);
  res.status(200).json({ message: "Company whitelist request rejected." });
});

/**
 * POST /api/auth/remove_certifier
 */
router.post("/remove_certifier", async (req, res) => {
  const { username } = req.body;

  const companyIndex = companies.findIndex((c) => c.username === username);
  if (companyIndex === -1 || !companies[companyIndex].approved) {
    return res.status(404).json({ error: "Certifier not found or not whitelisted" });
  }

  const company = companies[companyIndex];

  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiManagerConnected = UIManager.connect(masterWallet);
      return uiManagerConnected.removeWhiteListEntity(company.walletAddress, { nonce });
    });

    // Imposta approved: false
    company.approved = false;

    // Se l'utente era originariamente un lavoratore, riaggiungilo a users
    if (company.wasWorker) {
      const [removedCompany] = companies.splice(companyIndex, 1);
      users.push({
        id: `user${nextUserId++}`,
        username: removedCompany.username,
        role: "candidate",
        walletAddress: removedCompany.walletAddress,
        privateKey: removedCompany.privateKey,
      });
    }

    console.log("Certifier removed:", { username });
    res.json({ status: "certifier_removed", username });
  } catch (err) {
    console.error("Failed to remove certifier:", err);
    res.status(500).json({ error: "Failed to remove certifier", details: err.message });
  }
});

export default router;

