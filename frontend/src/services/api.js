import axios from "axios";

const USE_MOCK = false;
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  return config;
});

export const fetchUsers = () => API.get("/utils/users");
export const fetchCompanies = () => API.get("/utils/companies");
export const fetchUsersAndCompanies = () => API.get("/utils/all");

// Worker endpoints
export const postWorker = (data) => API.post("/auth/register/candidate", data);
export const postExperience = (data) => {
  console.log("Dati inviati a /claim/create_claim:", data); // Log per debug
  return API.post("/claim/create_claim", {
    ...data,
    company: data.company, // Assicurati che il campo sia 'company'
  });
};
export const getUserCertificates = (userId) => API.get(`/utils/user_certificates/${userId}`);

// Certifier endpoints
export const postCompany = (data) => API.post("/auth/register/company", data);
export const getMyRequestExperiences = (companyId) => API.get(`/claim/pending/${companyId}`);
export const postExperienceCertification = ({ claimId, companyUsername, isApproved }) => {
  const endpoint = isApproved ? "/claim/approve_claim" : "/claim/reject_claim";
  return API.post(endpoint, { claimId, companyUsername });
};

// Verifier endpoint
export const checkHash = ({ verifierUsername, certificateHash }) =>
  API.post("/verify/verify_certificate", { verifierUsername, certificateHash });
export const fundUser = ({ username, amount }) => API.post("/token/fund_user", { username, amount });

// Admin endpoints
export const requestWhitelist = (data) => API.post("/auth/request_whitelist", data);
export const getPendingWhitelistRequests = () => API.get("/auth/pending_whitelist_requests");
export const approveWhitelistRequest = (data) => API.post("/auth/approve_whitelist", data);
export const rejectWhitelistRequest = (data) => API.post("/auth/reject_whitelist", data);
export const removeCertifier = (data) => API.post("/auth/remove_certifier", data);

export default API;