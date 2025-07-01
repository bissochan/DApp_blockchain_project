import { jest } from "@jest/globals";

let request, app;
let users, companies, pendingClaims, certificates;

beforeAll(async () => {
  // === Mock blockchain ===
  await jest.unstable_mockModule("../src/contracts/contract.js", () => ({
    UIManager: {
      isWhitelisted: jest.fn().mockResolvedValue(false),
      connect: () => ({
        addWhiteListEntity: jest.fn().mockResolvedValue({
          hash: "0xmockAdd",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        removeWhiteListEntity: jest.fn().mockResolvedValue({
          hash: "0xmockRemove",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        storeCertificate: jest.fn().mockResolvedValue({
          hash: "0xmockCert",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      }),
    },
    TokenManager: {
      connect: () => ({
        buyTokens: jest.fn().mockResolvedValue({
          hash: "0xtoken",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      }),
    },
    StorageManager: {
      connect: () => ({
        getCertificate: jest.fn().mockResolvedValue({
          hash: "mockhash",
          cid: "mockcid",
          timestamp: "12345678",
        }),
      }),
    },
    provider: {},
    masterWallet: {
      address: "0xmasterwallet",
      privateKey: "0xprivatemock"
    }
  }));


  await jest.unstable_mockModule("../src/contracts/txQueue.js", () => ({
    enqueueTxForWallet: async (_, fn) => await fn(0),
  }));

  // === Dynamic import AFTER mocks ===
  request = (await import("supertest")).default;
  app = (await import("../index.js")).default;

  const db = await import("../database.js");
  users = db.users;
  companies = db.companies;
  pendingClaims = db.pendingClaims;
  certificates = db.certificates;
});

beforeEach(() => {
  users.length = 0;
  companies.length = 0;
  pendingClaims.length = 0;
  certificates.length = 0;
});

describe("Claim Management API", () => {
  const candidate = {
    id: "user_1",
    username: "alice",
    privateKey: "0x59c6995e998f97a5a004497e5d4e0d5dca0e46d67d05fbf5bc217d05c091b4b0" // hardhat key
  };

  const company = {
    id: "company_1",
    username: "block_corp",
    privateKey: "0x8b3a350cf5c34c9194ca7ed72bb6a2e0e9d9c9df50bf44c86f1a93b1a5c7f8ff", // hardhat key
    approvalStatus: "approved"
  };

  const claimPayload = {
    username: candidate.username,
    company: company.username,
    role: "Frontend Dev",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    description: "Worked on dApp UI"
  };

  beforeEach(() => {
    users.push({ ...candidate });
    companies.push({ ...company });
  });

  it("should allow a candidate to create a new claim", async () => {
    const res = await request(app)
      .post("/api/claim/create_claim")
      .send(claimPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("claimId");
    expect(pendingClaims).toHaveLength(1);
  });

  it("should return pending claims for the approved company", async () => {
    // Create a claim first
    await request(app).post("/api/claim/create_claim").send(claimPayload);

    const res = await request(app).get(`/api/claim/pending/${company.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("pending");
  });

  it("should approve a pending claim and store certificate", async () => {
    const createRes = await request(app)
      .post("/api/claim/create_claim")
      .send(claimPayload);

    const claimId = createRes.body.claimId;

    const res = await request(app)
      .post("/api/claim/approve_claim")
      .send({ companyUsername: company.username, claimId });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("certificateHash");
    expect(res.body).toHaveProperty("cid");
    expect(certificates.length).toBe(1);
    expect(pendingClaims[0].status).toBe("approved");
  });

  it("should reject a pending claim", async () => {
    const createRes = await request(app)
      .post("/api/claim/create_claim")
      .send(claimPayload);

    const claimId = createRes.body.claimId;

    const res = await request(app)
      .post("/api/claim/reject_claim")
      .send({ companyUsername: company.username, claimId });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("claim_rejected");
    expect(pendingClaims[0].status).toBe("rejected");
  });
});

describe("Claim Management API - Negative Tests", () => {
  const candidate = {
    id: "user_1",
    username: "alice",
    privateKey: "0x59c6995e998f97a5a004497e5d4e0d5dca0e46d67d05fbf5bc217d05c091b4b0"
  };

  const company = {
    id: "company_1",
    username: "block_corp",
    privateKey: "0x8b3a350cf5c34c9194ca7ed72bb6a2e0e9d9c9df50bf44c86f1a93b1a5c7f8ff",
    approvalStatus: "approved"
  };

  beforeEach(() => {
    users.push({ ...candidate });
    companies.push({ ...company });
  });

  test("should return 404 if user does not exist when creating a claim", async () => {
    const res = await request(app).post("/api/claim/create_claim").send({
      username: "ghost_user",
      company: company.username,
      role: "Dev",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      description: "Work"
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("should return 404 if company does not exist when creating a claim", async () => {
    const res = await request(app).post("/api/claim/create_claim").send({
      username: candidate.username,
      company: "non_existent_company",
      role: "Dev",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      description: "Work"
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Company not found");
  });

  test("should return 404 for pending claims if company not found", async () => {
    const res = await request(app).get("/api/claim/pending/company_xyz");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Company not found");
  });

  test("should return 403 for pending claims if company is pending approval", async () => {
    companies[0].approvalStatus = "pending";
    const res = await request(app).get(`/api/claim/pending/${company.id}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Company approval is still pending");
  });

  test("should return 404 when approving a claim that doesn't exist", async () => {
    const res = await request(app).post("/api/claim/approve_claim").send({
      companyUsername: company.username,
      claimId: "claim_999"
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Claim not found or already processed");
  });

  test("should return 403 when company does not match claim when approving", async () => {
    const otherCompany = {
      id: "company_2",
      username: "evilcorp",
      privateKey: company.privateKey,
      approvalStatus: "approved"
    };
    companies.push(otherCompany);

    const createRes = await request(app).post("/api/claim/create_claim").send({
      username: candidate.username,
      company: company.username,
      role: "Dev",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      description: "Work"
    });

    const res = await request(app).post("/api/claim/approve_claim").send({
      companyUsername: otherCompany.username,
      claimId: createRes.body.claimId
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Unauthorized approval attempt");
  });

  test("should return 403 when company does not match claim when rejecting", async () => {
    const createRes = await request(app).post("/api/claim/create_claim").send({
      username: candidate.username,
      company: company.username,
      role: "Dev",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      description: "Work"
    });

    const res = await request(app).post("/api/claim/reject_claim").send({
      companyUsername: "non_authorized_company",
      claimId: createRes.body.claimId
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Unauthorized rejection attempt");
  });

  test("should return 404 when rejecting a non-existent claim", async () => {
    const res = await request(app).post("/api/claim/reject_claim").send({
      companyUsername: company.username,
      claimId: "claim_999"
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Claim not found");
  });
});
