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

// Worker endpoints
export const postExperience = (data) => API.post("/post_exp", data);
export const getAllExperiences = () => API.get("/get_all_exp");

// Certifier endpoints
export const getAllRequestExperiences = () => API.get("/get_all_request_exp");
export const postExperienceCertification = (data) => API.post("/post_exp_cert", data);

// Verifier endpoint
export const checkHash = (hash) => API.post("/check", { hash });

export default API;