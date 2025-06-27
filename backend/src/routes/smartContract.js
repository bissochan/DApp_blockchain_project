import express from "express";
import { UIManager } from "../contracts/contract.js";

const router = express.Router();

router.post("/store_certificate", async (req, res) => {
  try {
    const { address, certificateHash, ipfsCid } = req.body;

    const tx = await UIManager.storeCertificate(address, certificateHash, ipfsCid);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Error storing certificate:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/get_certificate", async (req, res) => {
  try {
    const { address, certificateHash } = req.body;

    const [exists, cid] = await UIManager.connect(masterWallet).getCertificateInfo(certificateHash);
    res.json({ exists, cid });
  } catch (err) {
    console.error("Error fetching certificate:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


export default router;
