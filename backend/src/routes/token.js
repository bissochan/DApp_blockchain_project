import { ethers } from "ethers";
import express from "express";
import { admins, companies, users } from "../../database.js";
import { masterWallet, UIManager } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";

const router = express.Router();

/**
 * POST /api/token/fund_user
 * Mint tokens to a given user's wallet (onlyOwner function).
 */
router.post("/fund_user", async (req, res) => {
  const { username } = req.body;

  const user =
    users.find(u => u.username === username) ||
    companies.find(c => c.username === username) ||
    admins.find(a => a.username === username);
  if (!user) return res.status(404).json({ error: "User not found" });

  const tokenAmountToBuy = 100;
  const TOKEN_PER_ETHER = 10000;
  const etherToSend = tokenAmountToBuy / TOKEN_PER_ETHER; // 0.01
  const valueInWei = ethers.parseEther(etherToSend.toString());

  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiConnected = UIManager.connect(masterWallet);
      return uiConnected.buyTokens({ value: valueInWei, nonce });
    });

    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiConnected = UIManager.connect(masterWallet);
      return uiConnected.transferTokens(user.walletAddress, tokenAmountToBuy, { nonce });
    });

    res.json({
      status: "tokens_bought_and_transferred",
      username,
      toWallet: user.walletAddress,
      tokenAmount: tokenAmountToBuy,
      paidInEther: etherToSend,
    });

  } catch (err) {
    console.error("Token purchase failed:", err);
    res.status(500).json({ error: "Token purchase failed", details: err.message });
  }
});


router.post("/get_balance", async (req, res) => {
  console.log("Received get_balance request:", req.body);
  const { username } = req.body;

  const user = users.find(u => u.username === username) ||
    companies.find(c => c.username === username) ||
    admins.find(a => a.username === username);

  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const tokenBalance = await UIManager.getUserTokenBalance(user.walletAddress);
    res.json({ balance: tokenBalance.toString() });
  } catch (err) {
    console.error("Errore nel recupero balance via UIManager:", err);
    res.status(500).json({ error: "Errore nel recupero balance" });
  }
});

export default router;
