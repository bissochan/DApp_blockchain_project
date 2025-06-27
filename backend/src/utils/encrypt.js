import crypto from "crypto";

const SECRET_KEY = crypto.randomBytes(32); // 256-bit
const IV = crypto.randomBytes(16);         // 128-bit

export function encryptObject(data) {
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: IV.toString("hex"),
    encryptedData: encrypted
  };
}
