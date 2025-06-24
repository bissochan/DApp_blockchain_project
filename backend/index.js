import { createServer } from "http";

// Mock hash generator
const generateMockHash = () => {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 32; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
};

// Hardcoded data
let experiences = [
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

let certificationRequests = [
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

const verificationResults = {
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

// HTTP server
const server = createServer((req, res) => {
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL and body
  const url = new URL(req.url, `http://${req.headers.host}`);
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    let jsonBody = {};
    if (body && req.headers["content-type"] === "application/json") {
      try {
        jsonBody = JSON.parse(body);
        console.log("Body:", jsonBody);
      } catch (error) {
        console.error("Error parsing JSON:", error.message);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
    }

    // Handle routes
    try {
      if (req.method === "POST" && url.pathname === "/api/post_exp") {
        const { company, role, startDate, endDate, description } = jsonBody;
        if (!company || !role || !startDate) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing required fields" }));
          return;
        }
        const newExperience = {
          id: experiences.length + 1,
          company,
          role,
          startDate,
          endDate: endDate || "",
          description: description || "",
          hash: generateMockHash(),
        };
        experiences.push(newExperience);
        console.log("New experience added:", newExperience);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newExperience));
      } else if (req.method === "GET" && url.pathname === "/api/get_all_exp") {
        console.log("Returning all experiences:", experiences);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(experiences));
      } else if (req.method === "GET" && url.pathname === "/api/get_all_request_exp") {
        console.log("Returning certification requests:", certificationRequests);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(certificationRequests));
      } else if (req.method === "POST" && url.pathname === "/api/post_exp_cert") {
        const { id, isApproved } = jsonBody;
        if (!id || typeof isApproved !== "boolean") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing or invalid fields" }));
          return;
        }
        const requestIndex = certificationRequests.findIndex((req) => req.id === id);
        if (requestIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request not found" }));
          return;
        }
        if (isApproved) {
          const request = certificationRequests[requestIndex];
          experiences.push({ ...request, id: experiences.length + 1, hash: generateMockHash() });
          console.log("Experience approved and added:", request);
        }
        certificationRequests.splice(requestIndex, 1);
        console.log(`Certification ${isApproved ? "approved" : "rejected"} for id: ${id}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } else if (req.method === "POST" && url.pathname === "/api/check") {
        const { hash } = jsonBody;
        if (!hash) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing hash" }));
          return;
        }
        const result = verificationResults[hash] || { valid: false };
        console.log(`Verification result for hash ${hash}:`, result);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } catch (error) {
      console.error(`Error handling ${req.method} ${url.pathname}:`, error.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});