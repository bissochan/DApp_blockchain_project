import wallets from "./src/utils/wallets.js";
// Simulates a simple in-memory database for user and CV data

/* admins structure:
* {
*  id: 'admin1',
*  username: 'admin',
*  role: 'admin',
*  walletAddress: '0x...',
*  privateKey: '0x...',
* }
*/
export const admins = [
  {
    id: "admin1",
    username: "admin",
    role: "admin",
    walletAddress: wallets[0].address,
    privateKey: wallets[0].privateKey,
  },
];

/* users structure:
* {
*  id: 'user1',
*  username: 'certifier1',
*  role: 'candidate',
*  walletAddress: '0x...',
*  privateKey: '0x...',
* }
*/
export const users = [
  {
    id: "user0",
    username: "alice",
    role: "candidate",
    walletAddress: wallets[1].address,
    privateKey: wallets[1].privateKey
  },
  {
    id: "user1",
    username: "bob",
    role: "candidate",
    walletAddress: wallets[2].address,
    privateKey: wallets[2].privateKey
  },
  {
    id: "user2",
    username: "carol",
    role: "candidate",
    walletAddress: wallets[3].address,
    privateKey: wallets[3].privateKey
  }
];

/* companies structure:
* {
*  id: 'company1',
*  username: 'company1',
*  role: 'company',
*  approvalStatus: 'pending' | 'approved' | 'rejected',
*  walletAddress: '0x...',
*  privateKey: '0x...',
* }
*/

export const companies = [
  {
    id: "company0",
    username: "tech_corp",
    role: "company",
    approvalStatus: "approved",
    walletAddress: wallets[4].address,
    privateKey: wallets[4].privateKey,
  },
  {
    id: "company1",
    username: "block_inc",
    role: "company",
    approvalStatus: "approved",
    walletAddress: wallets[5].address,
    privateKey: wallets[5].privateKey,
  },
  {
    id: "company2",
    username: "web3_solutions",
    role: "company",
    approvalStatus: "pending",
    walletAddress: wallets[6].address,
    privateKey: wallets[6].privateKey,
  }
];

/* pendingWhitelistRequests structure:
* {
*   requestId: 'req_...',
*   companyId: 'company3',
*   username: 'example_company'
* }
*/
export const pendingWhitelistRequests = [];

/* pendingClaims structure:
* {
*  claimId: 'claim_1',
*  claim: {
*    userId: 1,
*    companyId: 1,
*    role: 'Job Role',
*    startDate: 'YYYY-MM-DD',
*    endDate: 'YYYY-MM-DD' | '',
*    description: 'Job Description',
*    timestamp: 'YYYY-MM-DDTHH:mm:ssZ'
*  },
*  userSignature: '0x...',
*  status: 'pending' | 'approved' | 'rejected'
* }
*/
export const pendingClaims = [
];

/* certificates structure:
* {
*  certificateHash: '0x...',
*  cid: 'Qm...',
*  userId: 1, // ID of the user who owns this certificate
*  companyId: 1, // ID of the company that issued this certificate
* }
*/
export const certificates = [
];

export const pendingWhitelistRequests = [];

export const admins = [
  {
    id: "admin1",
    username: "admin",
    role: "admin",
    walletAddress: "0x0000000000000000000000000000000000000000",
    privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
];