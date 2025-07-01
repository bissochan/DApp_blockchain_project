import { jest } from "@jest/globals";

let request, app;
let companies, pendingWhitelistRequests, users;

beforeAll(async () => {
  // Mock blockchain modules before importing the app
  await jest.unstable_mockModule("../src/contracts/contract.js", () => ({
    UIManager: {
      isWhitelisted: jest.fn().mockResolvedValue(false),
      connect: () => ({
        addWhiteListEntity: jest.fn().mockResolvedValue({
          hash: "0xtxhash1",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        removeWhiteListEntity: jest.fn().mockResolvedValue({
          hash: "0xtxhash2",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      }),
    },
    TokenManager: {
      connect: () => ({
        buyTokens: jest.fn().mockResolvedValue({
          hash: "0xtxtoken",
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
    masterWallet: { address: "0xmasterwallet" },
    provider: {},
  }));

  await jest.unstable_mockModule("../src/contracts/txQueue.js", () => ({
    enqueueTxForWallet: async (_, fn) => await fn(0),
  }));

  // Dynamic imports after mocks
  request = (await import("supertest")).default;
  app = (await import("../index.js")).default;

  const db = await import("../database.js");
  companies = db.companies;
  pendingWhitelistRequests = db.pendingWhitelistRequests;
  users = db.users;
});

describe("Auth API", () => {
  let companyUsername = `company_test_${Date.now()}`;
  let companyId;
  let requestId;

  it("should register a new candidate", async () => {
    const res = await request(app)
      .post("/api/auth/register/candidate")
      .send({ username: "candidate_test" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("walletAddress");

    const user = users.find(u => u.username === "candidate_test");
    expect(user).toBeDefined();
  });

  it("should register a new company", async () => {
    const res = await request(app)
      .post("/api/auth/register/company")
      .send({ username: companyUsername });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("walletAddress");

    const company = companies.find(c => c.username === companyUsername);
    const requestEntry = pendingWhitelistRequests.find(r => r.username === companyUsername);

    expect(company).toBeDefined();
    expect(requestEntry).toBeDefined();

    companyId = company.id;
    requestId = requestEntry.requestId;
  });

  it("should return all pending whitelist requests", async () => {
    const res = await request(app).get("/api/auth/pending_whitelist_requests");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(r => r.username === companyUsername)).toBeDefined();
  });

  it("should approve a pending whitelist request", async () => {
    const res = await request(app)
      .post("/api/auth/approve_whitelist")
      .send({ requestId });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Company approved and whitelisted.");

    const company = companies.find(c => c.username === companyUsername);
    expect(company?.approvalStatus).toBe("approved");

    const stillPending = pendingWhitelistRequests.find(r => r.requestId === requestId);
    expect(stillPending).toBeUndefined();
  });

  it("should remove a certifier from the whitelist", async () => {
    const res = await request(app)
      .post("/api/auth/remove_certifier")
      .send({ username: companyUsername });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Certifier removed from whitelist");

    const company = companies.find(c => c.username === companyUsername);
    expect(company?.approvalStatus).toBe("removed");
  });

  it("should reject a whitelist request", async () => {
    const secondUsername = `company_reject_${Date.now()}`;

    await request(app)
      .post("/api/auth/register/company")
      .send({ username: secondUsername });

    const req = pendingWhitelistRequests.find(r => r.username === secondUsername);
    expect(req).toBeDefined();

    const res = await request(app)
      .post("/api/auth/reject_whitelist")
      .send({ requestId: req.requestId });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Company whitelist request rejected.");

    const company = companies.find(c => c.username === secondUsername);
    expect(company?.approvalStatus).toBe("rejected");
  });
});

describe("Auth API - Negative tests", () => {
  test("should return 400 when candidate registration is missing username", async () => {
    const res = await request(app).post("/api/auth/register/candidate").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing username");
  });

  test("should return 400 when registering a duplicate candidate", async () => {
    const username = "duplicate_candidate";
    await request(app).post("/api/auth/register/candidate").send({ username });
    const res = await request(app).post("/api/auth/register/candidate").send({ username });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("User already exists");
  });

  test("should return 400 when company registration is missing username", async () => {
    const res = await request(app).post("/api/auth/register/company").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing username");
  });

  test("should return 400 when registering a duplicate company", async () => {
    const username = "duplicate_company";
    await request(app).post("/api/auth/register/company").send({ username });
    const res = await request(app).post("/api/auth/register/company").send({ username });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("User already exists");
  });

  test("should return 404 when approving a non-existent whitelist request", async () => {
    const res = await request(app).post("/api/auth/approve_whitelist").send({ requestId: "non_existent_req" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Request not found");
  });

  test("should return 404 when rejecting a non-existent whitelist request", async () => {
    const res = await request(app).post("/api/auth/reject_whitelist").send({ requestId: "invalid_req" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Request not found");
  });

  test("should return 400 when removing certifier without username", async () => {
    const res = await request(app).post("/api/auth/remove_certifier").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing username");
  });

  test("should return 404 when removing a non-existent certifier", async () => {
    const res = await request(app).post("/api/auth/remove_certifier").send({ username: "ghost_company" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Company not found");
  });
});
