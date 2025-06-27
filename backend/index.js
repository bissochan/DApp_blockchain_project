import cors from "cors";
import express from "express";
import { certificationRequests, experiences, verificationResults } from "./database.js";
import { masterWallet } from "./src/contracts/contract.js";
import { ensureDefaultCompanyWhitelisted } from "./src/contracts/setup.js";
import authRouter from "./src/routes/auth.js";
import claimsRouter from "./src/routes/claims.js";

console.log("Master Wallet Address:", masterWallet.address);
console.log("Master Private Key:", masterWallet.privateKey);

ensureDefaultCompanyWhitelisted();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());


// Mock hash generator
const generateMockHash = () => {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 32; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
};

// === ROUTES ===

// Authentication & Registration
// POST /api/auth/register/candidate → Register a new candidate
// POST /api/auth/register/company   → Register a new company (also triggers on-chain whitelist)
app.use("/api/auth", authRouter);

// Claim Management
// POST /api/claim/create_claim      → User creates a new claim
// GET  /api/claim/pending/:companyId → Get pending claims for a company
// POST /api/claim/approve_claim     → Company approves a claim (on-chain)
// POST /api/claim/reject_claim      → Company rejects a claim (off-chain only)
app.use("/api/claim", claimsRouter);


// POST /api/post_exp
app.post("/api/store_certificate", (req, res) => {
  const { company, role, startDate, endDate, description } = req.body;
  if (!company || !role || !startDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newExperience = {
    id: experiences.length + 1,
    company,
    role,
    startDate,
    endDate: endDate || "",
    description: description || "",
    hash: generateMockHash(),
  };
  experiences.push(newExperience);
  console.log("New experience added:", newExperience);
  res.status(201).json(newExperience);
});

// GET /api/get_all_exp
app.get("/api/get_all_exp", (req, res) => {
  console.log("Returning all experiences:", experiences);
  res.json(experiences);
});

// GET /api/get_all_request_exp
app.get("/api/get_all_request_exp", (req, res) => {
  console.log("Returning certification requests:", certificationRequests);
  res.json(certificationRequests);
});

// POST /api/post_exp_cert
app.post("/api/post_exp_cert", (req, res) => {
  const { id, isApproved } = req.body;
  if (!id || typeof isApproved !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }
  const requestIndex = certificationRequests.findIndex((req) => req.id === id);
  if (requestIndex === -1) {
    return res.status(404).json({ error: "Request not found" });
  }
  if (isApproved) {
    const request = certificationRequests[requestIndex];
    experiences.push({ ...request, id: experiences.length + 1, hash: generateMockHash() });
    console.log("Experience approved and added:", request);
  }
  certificationRequests.splice(requestIndex, 1);
  console.log(`Certification ${isApproved ? "approved" : "rejected"} for id: ${id}`);
  res.json({ success: true });
});

// POST /api/check
app.post("/api/check", (req, res) => {
  const { hash } = req.body;
  if (!hash) {
    return res.status(400).json({ error: "Missing hash" });
  }
  const result = verificationResults[hash] || { valid: false };
  console.log(`Verification result for hash ${hash}:`, result);
  res.json(result);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});