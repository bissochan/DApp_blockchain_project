import axios from "axios";

const USE_MOCK = false;
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});


API.interceptors.request.use((config) => {
    // Add any request interceptors here if needed
    //for example we can add auth here
  return config;
});

export const fetchUsers = () => API.get("/utils/users");
export const fetchCompanies = () => API.get("/utils/companies");
export const fetchUsersAndCompanies = () => API.get("/utils/all");

// Worker endpoints
export const postExperience = (data) => API.post("/claim/create_claim", data);
export const getUserCertificates = (userId) => API.get(`/utils/user_certificates/${userId}`);

// Certifier endpoints
export const getMyRequestExperiences = (companyId) => API.get(`/claim/pending/${companyId}`);
export const postExperienceCertification = ({ claimId, companyUsername, isApproved }) => {
  const endpoint = isApproved ? "/claim/approve_claim" : "/claim/reject_claim";
  return API.post(endpoint, { claimId, companyUsername });
};

// Verifier endpoint
export const checkHash = ({ verifierUsername, certificateHash }) =>
  API.post("/verify/verify_certificate", { verifierUsername, certificateHash });
export const fundUser = ({ username, amount }) => API.post("/token/fund_user", { username, amount });


export default API;