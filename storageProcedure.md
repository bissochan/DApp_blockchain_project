## 🔹 Route: /create_claim

```js
import express from "express";
import { users, companies } from "../../database.js";
import { ethers } from "ethers";

const router = express.Router();

// DB temporaneo in-memory
export const pendingClaims = [];

let nextClaimId = 1;

router.post("/create_claim", async (req, res) => {
  const { username, company, role, startDate, endDate, description } = req.body;

  // 1. Recupera utente dal database
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: "User not found" });

  // 2. Recupera azienda dal database
  const companyObj = companies.find(c => c.username === company);
  if (!companyObj) return res.status(404).json({ error: "Company not found" });

  // 3. Crea oggetto claim (dati + metadata)
  const claim = {
    userId: user.id,
    companyId: companyObj.id,
    role,
    startDate,
    endDate,
    description,
    timestamp: Date.now()
  };

  // 4. Firma il claim con il wallet dell'utente
  const claimString = JSON.stringify(claim);
  const userWallet = new ethers.Wallet(user.privateKey);
  const userSignature = await userWallet.signMessage(claimString);

  // 5. Genera ID del claim
  const claimId = `claim_${nextClaimId++}`;

  // 6. Salva il claim firmato nel DB temporaneo
  pendingClaims.push({
    claimId,
    userId: user.id,
    companyId: companyObj.id,
    claim,
    userSignature,
    status: "pending"
  });

  // 7. Risposta al frontend
  res.json({
    status: "claim_created",
    claimId
  });
});

export default router;
```
