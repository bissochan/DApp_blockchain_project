import crypto from "crypto";

const SECRET_KEY = crypto
  .createHash("sha256")
  .update("my-very-secret-and-consistent-password")
  .digest(); // 32 bytes

export function encryptObject(data) {
  const iv = crypto.randomBytes(16); // nuovo IV per ogni cifratura
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted
  };
}

export function decryptObject({ iv, encryptedData }) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, Buffer.from(iv, "hex"));
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}
