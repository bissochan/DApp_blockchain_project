import { createHash } from "crypto";
import fs from "fs";
import path from "path";

const IPFS_DIR = path.resolve("fake_ipfs");

// Ensure the directory exists
if (!fs.existsSync(IPFS_DIR)) {
  fs.mkdirSync(IPFS_DIR);
}

/**
 * Store data in a simulated IPFS-like storage
 */
export function fakeIpfsAdd(data) {
  const stringified = JSON.stringify(data);
  const cid = createHash("sha256")
    .update(stringified)
    .digest("hex")
    .slice(0, 46);
  const filePath = path.join(IPFS_DIR, `${cid}.json`);
  fs.writeFileSync(filePath, stringified, "utf-8");
  return cid;
}

/**
 * Retrieve data from the simulated IPFS-like storage
 */
export function fakeIpfsCat(cid) {
  const filePath = path.join(IPFS_DIR, `${cid}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error("Fake IPFS CID not found");
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}
