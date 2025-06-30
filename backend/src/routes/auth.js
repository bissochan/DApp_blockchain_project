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

  companies.push({
    id: `company${nextCompanyId++}`,
    username,
    role: "company",
    approved: false,
    walletAddress: ethers.getAddress(assignedWallet.address),
    privateKey: assignedWallet.privateKey,
    wasWorker: false, // Nuovo flag per tracciare se era un lavoratore
  });

  console.log("Company registered:", username);
  res.status(201).json({
    message: "Company registered",
    walletAddress: assignedWallet.address,
  });
});

/**
 * POST /api/auth/request_whitelist
 */
router.post("/request_whitelist", (req, res) => {
  const { username } = req.body;

  const entity = users.find((u) => u.username === username) || companies.find((c) => c.username === username);
  if (!entity) {
    return res.status(404).json({ error: "Entity not found" });
  }

  if (entity.role === "company" && entity.approved) {
    return res.status(400).json({ error: "Entity already whitelisted" });
  }

  const existingRequest = pendingWhitelistRequests.find((r) => r.username === username && r.status === "pending");
  if (existingRequest) {
    return res.status(400).json({ error: "Whitelist request already pending" });
  }

  const requestId = `whitelist_${nextWhitelistRequestId++}`;
  pendingWhitelistRequests.push({
    requestId,
    username,
    walletAddress: entity.walletAddress,
    status: "pending",
  });

  console.log("Whitelist request created:", { requestId, username });
  res.status(201).json({ status: "whitelist_request_created", requestId });
});

/**
 * GET /api/auth/pending_whitelist_requests
 */
router.get("/pending_whitelist_requests", (req, res) => {
  const pending = pendingWhitelistRequests.filter((r) => r.status === "pending");
  res.json(pending);
});

/**
 * POST /api/auth/approve_whitelist
 */
router.post("/approve_whitelist", async (req, res) => {
  const { requestId } = req.body;

  const request = pendingWhitelistRequests.find((r) => r.requestId === requestId);
  if (!request || request.status !== "pending") {
    return res.status(404).json({ error: "Whitelist request not found or already processed" });
  }

  const entity = users.find((u) => u.username === request.username) || companies.find((c) => c.username === request.username);
  if (!entity) {
    return res.status(404).json({ error: "Entity not found" });
  }

  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiManagerConnected = UIManager.connect(masterWallet);
      return uiManagerConnected.addWhiteListEntity(entity.walletAddress, { nonce });
    });

    request.status = "approved";

    if (entity.role === "candidate") {
      const userIndex = users.findIndex((u) => u.username === request.username);
      if (userIndex !== -1) {
        const [user] = users.splice(userIndex, 1);
        companies.push({
          id: `company${nextCompanyId++}`,
          username: user.username,
          role: "company",
          approved: true,
          walletAddress: user.walletAddress,
          privateKey: user.privateKey,
          wasWorker: true, // Segna che era un lavoratore
        });
      }
    } else {
      entity.approved = true;
    }

    console.log("Whitelist request approved:", { requestId, username: entity.username });
    res.json({ status: "whitelist_approved", username: entity.username });
  } catch (err) {
    console.error("Failed to approve whitelist request:", err);
    res.status(500).json({ error: "Failed to approve whitelist", details: err.message });
  }
});

/**
 * POST /api/auth/reject_whitelist
 */
router.post("/reject_whitelist", (req, res) => {
  const { requestId } = req.body;

  const request = pendingWhitelistRequests.find((r) => r.requestId === requestId);
  if (!request || request.status !== "pending") {
    return res.status(404).json({ error: "Whitelist request not found or already processed" });
  }

  request.status = "rejected";
  console.log("Whitelist request rejected:", { requestId, username: request.username });
  res.json({ status: "whitelist_rejected", requestId });
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