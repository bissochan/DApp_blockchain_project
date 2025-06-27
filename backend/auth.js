import express from "express";
const router = express.Router();

import fs from "fs";
import path from "path";

const walletsPath = path.resolve("../blockchain_folder/wallets.json");
const walletsData = fs.readFileSync(walletsPath, "utf-8");
const wallets = JSON.parse(walletsData);
let walletIndex = 1;

// In-memory user "database" (MVP)
const users = [];

// Function to take next wallet
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
 * Register a candidate user.
 * Body: { username, password }
 */
router.post("/register/candidate", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
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

  // Save wallet address and private key for your records (e.g., in your user DB)
  users.push({
    username,
    password,
    role: "candidate",
    walletAddress: assignedWallet.address,
    privateKey: assignedWallet.privateKey, // store securely!
  });

  console.log("Candidate registered:", username);
  res.status(201).json({
    message: "Candidate registered",
    walletAddress: assignedWallet.address,
  });
});

/**
 * POST /api/auth/register/company
 * Register a company user.
 * Body: { username, password }
 * Note: company may need manual approval later.
 */
router.post("/register/company", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  // In MVP checking of company existance is not implemented
  let assignedWallet;
  try {
    assignedWallet = getNextWallet();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  // Store company with role "company"
  users.push({
    username,
    password,
    role: "company",
    approved: true,
    walletAddress: assignedWallet.address,
    privateKey: assignedWallet.privateKey,
  });

  console.log("Company registered:", username);
  res.status(201).json({
    message: "Company registered",
    walletAddress: assignedWallet.address,
  });
});

export default router;
