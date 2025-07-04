import express from "express";
import { certificates, companies, users } from "../../database.js";

const router = express.Router();

router.get("/users", (req, res) => {
  res.json(users);
});

router.get("/companies", (req, res) => {
  res.json(companies);
});

router.get("/all", (req, res) => {
  res.json({ users, companies });
});

router.get("/user_certificates/:userId", (req, res) => {
  const { userId } = req.params;
  const userCerts = certificates.filter((cert) => cert.userId === userId);
  res.json(userCerts);
});

export default router;
