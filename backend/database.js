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
*  company: 'Company Name',
*  role: 'Job Role',
*  startDate: 'YYYY-MM-DD',
*  endDate: 'YYYY-MM-DD',
* }
*/
export const certificationRequests = [
  {
    id: 3,
    company: "Startup XYZ",
    role: "Ingegnere Blockchain",
    startDate: "2024-01-01",
    endDate: "",
  },
  {
    id: 4,
    company: "HR Solutions",
    role: "Manager HR",
    startDate: "2023-03-01",
    endDate: "2023-09-30",
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
