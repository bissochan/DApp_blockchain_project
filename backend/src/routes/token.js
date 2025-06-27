import { ethers } from "ethers";
import express from "express";
import { users } from "../../database.js";
import { UIManager, masterWallet } from "../contracts/contract.js";
import { enqueueTxForWallet } from "../contracts/txQueue.js";

const router = express.Router();

/**
 * POST /api/token/fund_user
 * Mint tokens to a given user's wallet (onlyOwner function).
 */
router.post("/fund_user", async (req, res) => {
  const { username, amount } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: "User not found" });

  const amountInWei = ethers.parseUnits(amount.toString(), 18);

  try {
    await enqueueTxForWallet(masterWallet, (nonce) => {
      const uiConnected = UIManager.connect(masterWallet);
      return uiConnected.mintUserTokens(user.walletAddress, amountInWei, { nonce });
    });

    res.json({
      status: "tokens_minted",
      username,
      wallet: user.walletAddress,
      amount
    });

  } catch (err) {
    console.error("Minting failed:", err);
    res.status(500).json({ error: "Minting failed", details: err.message });
  }
});

export default router;
