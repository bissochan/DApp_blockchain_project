import cors from "cors";
import express from "express";
import { masterWallet } from "./src/contracts/contract.js";
import { ensureDefaultCompanyWhitelisted } from "./src/contracts/setup.js";
import authRouter from "./src/routes/auth.js";
import claimsRouter from "./src/routes/claims.js";
import utilsRouter from "./src/routes/DB_queries.js";
import tokenRouter from "./src/routes/token.js";
import verifyRouter from "./src/routes/verify.js";

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

app.use("/api/utils", utilsRouter);

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

// Certificate Verification
// POST /api/verify/verify_certificate → A verifier pays tokens to access and decrypt a certificate
app.use("/api/verify", verifyRouter);

// Token Management
// GET  /api/token/balance             → Retrieves token balance for a user
// POST /api/token/buy                 → Buys tokens by sending Ether (on-chain)
app.use("/api/token", tokenRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});