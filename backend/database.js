import wallets from "./src/utils/wallets.js";
// Simulates a simple in-memory database for user and CV data

/* users structure:
* {
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
*  username: 'company1',
*  role: 'company',
*  approved: true,
*  walletAddress: '0x...',
*  privateKey: '0x...',
*  certificationRequests: [ id1, id2, ... ] // array of certification request IDs
* }
*/

export const companies = [
  {
    id: "company0",
    username: "tech_corp",
    role: "company",
    approved: true,
    walletAddress: wallets[4].address,
    privateKey: wallets[4].privateKey,
    certificationRequests: []
  },
  {
    id: "company1",
    username: "block_inc",
    role: "company",
    approved: false,
    walletAddress: wallets[5].address,
    privateKey: wallets[5].privateKey,
    certificationRequests: []
  }
];

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

/* experiences structure:
* {
*  id: 1,
*  company: 'Company Name',
*  role: 'Job Role',
*  startDate: 'YYYY-MM-DD',
*  endDate: 'YYYY-MM-DD' | '',
*  description: 'Job Description',
*  hash: '0x...' // unique hash for the experience
* }
*/
export const experiences = [
  {
    id: 1,
    company: "Tech Corp",
    role: "Sviluppatore Frontend",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    description: "Sviluppo di interfacce utente con React.",
    hash: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: 2,
    company: "Data Inc",
    role: "Analista Dati",
    startDate: "2022-06-01",
    endDate: "2022-12-31",
    description: "Analisi di dati aziendali con Python.",
    hash: "0x1234567890abcdef1234567890abcdef12345678",
  },
];

/* experiences structure:
* {
*  id: 1,
*  username: 'candidate1',
*  company: 'Company Name',
*  role: 'Job Role',
*  startDate: 'YYYY-MM-DD',
*  endDate: 'YYYY-MM-DD',
*  description: 'Job Description',
* }
*/
export const certificationRequests = [
  {
    id: 3,
    username: "candidate1",
    company: "Startup XYZ",
    role: "Ingegnere Blockchain",
    startDate: "2024-01-01",
    endDate: "",
    description: "Sviluppo di smart contracts e soluzioni blockchain.",
  },
  {
    id: 4,
    username: "candidate2",
    company: "HR Solutions",
    role: "Manager HR",
    startDate: "2023-03-01",
    endDate: "2023-09-30",
    description: "Gestione delle risorse umane e sviluppo organizzativo.",
  },
];

/* verificationResults structure:
* {
*   [certificateHash]: {
*     valid: true | false,
*     company: 'Company Name',
*     role: 'Job Role',
*     startDate: 'YYYY-MM-DD',
*     endDate: 'YYYY-MM-DD' | '',
*   },
*   [verificationHash]: {
*     valid: true | false,
*   },
* }
*/
export const verificationResults = {
  "0xabcdef1234567890abcdef1234567890abcdef12": {
    valid: true,
    company: "Tech Corp",
    role: "Sviluppatore Frontend",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
  },
  "0x5678": {
    valid: false,
  },
};
