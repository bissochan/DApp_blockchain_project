import fs from "fs";
import path from "path";

const walletsPath = path.resolve("../blockchain_folder/address_data/wallets.json");
const walletsData = fs.readFileSync(walletsPath, "utf-8");
const wallets = JSON.parse(walletsData);

export default wallets;
