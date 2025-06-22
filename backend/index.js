import cors from "cors";
import { JsonRpcProvider, Wallet } from "ethers";
import express from "express";
import fs from "fs";
import path from "path";
import authRouter from "./auth.js";

const walletsPath = path.resolve("../blockchain_folder/wallets.json");
const walletsData = fs.readFileSync(walletsPath, "utf-8");
const wallets = JSON.parse(walletsData);
const firstWallet = wallets[0];

const provider = new JsonRpcProvider("http://127.0.0.1:8545");
const masterWallet = new Wallet(firstWallet.privateKey, provider);
console.log("Master Wallet Address:", masterWallet.address);
console.log("Master Private Key:", masterWallet.privateKey);

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

// Hardcoded data
let experiences = [
  {
    id: 1,
    company: "Tech Corp",
    role: "Sviluppatore Frontend",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    description: "Sviluppo di interfacce utente con React.",
    hash: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: 2,
    company: "Data Inc",
    role: "Analista Dati",
    startDate: "2022-06-01",
    endDate: "2022-12-31",
    description: "Analisi di dati aziendali con Python.",
    hash: "0x1234567890abcdef1234567890abcdef12345678",
  },
];

let certificationRequests = [
  {
    id: 3,
    company: "Startup XYZ",
    role: "Ingegnere Blockchain",
    startDate: "2024-01-01",
    endDate: "",
  },
  {
    id: 4,
    company: "HR Solutions",
    role: "Manager HR",
    startDate: "2023-03-01",
    endDate: "2023-09-30",
  },
];

const verificationResults = {
  "0xabcdef1234567890abcdef1234567890abcdef12": {
    valid: true,
    company: "Tech Corp",
    role: "Sviluppatore Frontend",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
  },
  "0x5678": {
    valid: false,
  },
};

// Routes

// POST /api/auth/register/candidate or /company
app.use("/api/auth", authRouter);

// POST /api/post_exp
app.post("/api/post_exp", (req, res) => {
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