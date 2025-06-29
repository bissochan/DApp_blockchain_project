import { ethers } from "ethers";
import express from "express";
import { companies, users } from "../../database.js";
import { masterWallet, UIManager } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";
import wallets from "../utils/wallets.js";

const router = express.Router();

// Wallet index management
let walletIndex = users.length + companies.length + 1; // Skip wallet[0] as it's the master wallet
let nextUserId = users.length;
let nextCompanyId = companies.length;

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
 * Register a new candidate with username and assign wallet.
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

  // Store user and wallet info (simplified for MVP)
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
 * Register a new company and whitelist it on-chain.
 */
router.post("/register/company", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  if (companies.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Wallet assignment (no company verification for MVP)
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

  // Whitelist on-chain using master wallet
  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiManagerConnected = UIManager.connect(masterWallet);
      return uiManagerConnected.addWhiteListEntity(assignedWallet.address, { nonce });
    });
  } catch (err) {
    console.error("Failed to whitelist company:", err);
    return res.status(500).json({ error: "Failed to whitelist company", details: err.message });
  }

  // Save company info off-chain
  companies.push({
    id: `company${nextCompanyId++}`,
    username,
    role: "company",
    approved: true,
    walletAddress: ethers.getAddress(assignedWallet.address),
    privateKey: assignedWallet.privateKey,
  });


  console.log("Company registered and whitelisted:", username);
  res.status(201).json({
    message: "Company registered",
    walletAddress: assignedWallet.address,
  });
});

export default router;
