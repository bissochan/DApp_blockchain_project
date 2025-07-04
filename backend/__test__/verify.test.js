import { jest } from "@jest/globals";

let request, app;
let users, companies, admins, certificates;
let fakeIpfsCat, decryptObject;
let mockParseLog;

beforeAll(async () => {
  mockParseLog = jest.fn().mockReturnValue({
    name: "CertificateLookup",
    args: {
      ipfsCid: "CID:valid123",
    },
  });

  await jest.unstable_mockModule("../src/contracts/contract.js", () => ({
    UIManager: {
      connect: () => ({
        getCertificateInfo: jest.fn().mockResolvedValue({
          logs: [{ topics: [], data: "" }],
        }),
        interface: { parseLog: mockParseLog },
      }),
      interface: { parseLog: mockParseLog },
      target: "0xUIMock",
      isWhitelisted: jest.fn().mockResolvedValue(true),
    },
    TokenManager: {
      connect: () => ({
        approve: jest
          .fn()
          .mockResolvedValue({ hash: "0xMOCK", wait: jest.fn() }),
      }),
      balanceOf: jest.fn().mockResolvedValue(1000n),
    },
    masterWallet: {
      address: "0xmasterwallet",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    provider: {},
  }));

  await jest.unstable_mockModule("../src/contracts/txQueue.js", () => ({
    enqueueTxForWallet: async (_, fn) => await fn(0),
  }));

  await jest.unstable_mockModule("../src/utils/encrypt.js", () => {
    decryptObject = jest.fn().mockReturnValue({
      claim: {
        role: "developer",
        userId: "user1",
        companyId: "comp1",
      },
    });
    return {
      decryptObject,
      encryptObject: jest.fn(),
    };
  });

  await jest.unstable_mockModule("../src/utils/fakeIpfs.js", () => {
    fakeIpfsCat = jest.fn().mockReturnValue({ encrypted: "data" });
    return { fakeIpfsCat, fakeIpfsAdd: jest.fn() };
  });

  request = (await import("supertest")).default;
  app = (await import("../index.js")).default;
  const db = await import("../database.js");
  users = db.users;
  companies = db.companies;
  admins = db.admins;
  certificates = db.certificates;
});

beforeEach(() => {
  users.length = 0;
  companies.length = 0;
  admins.length = 0;
  certificates.length = 0;
});

describe("POST /api/verify/verify_certificate - Success cases", () => {
  beforeEach(() => {
    users.push({
      id: "user1",
      username: "alice",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      walletAddress: "0xabc",
    });
    companies.push({ id: "comp1", username: "web3_solutions" });
    certificates.push({
      userId: "user1",
      companyId: "comp1",
      certificateHash: "hash_1",
    });
  });

  it("should verify certificate and return decrypted data", async () => {
    const contract = await import("../src/contracts/contract.js");
    contract.TokenManager.balanceOf = jest.fn().mockResolvedValue(1000n);

    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "alice", certificateHash: "hash_1" });

    console.log("✅ Success Test Response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.certificate.claim).toHaveProperty("role", "developer");
    expect(res.body.certificate.claim).toHaveProperty("user", "alice");
    expect(res.body.certificate.claim).toHaveProperty(
      "company",
      "web3_solutions"
    );
  });
});

describe("POST /api/verify/verify_certificate - Failure cases", () => {
  it("should return 404 if verifier not found", async () => {
    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "ghost", certificateHash: "hash_1" });

    console.log("❌ Verifier not found:", res.body);
    expect(res.statusCode).toBe(404);
    expect(res.body?.error).toMatch(/Verifier not found/);
  });

  it("should return 404 if certificate not found", async () => {
    users.push({
      username: "alice",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      walletAddress: "0xabc",
    });

    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "alice", certificateHash: "missing" });

    console.log("❌ Certificate not found:", res.body);
    expect(res.statusCode).toBe(404);
    expect(res.body?.error).toMatch(/Certificate not found/);
  });

  it("should return 500 if insufficient token balance", async () => {
    const contract = await import("../src/contracts/contract.js");
    contract.TokenManager.balanceOf = jest.fn().mockResolvedValue(5n);

    users.push({
      username: "alice",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      walletAddress: "0xabc",
    });
    certificates.push({ certificateHash: "hash_1" });

    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "alice", certificateHash: "hash_1" });

    console.log("❌ Insufficient balance:", res.body);
    expect(res.statusCode).toBe(500);
    expect(res.body?.error).toBe("Verification failed");
    expect(res.body?.details).toMatch(/Insufficient token balance/);
  });

  it("should return 500 if CertificateLookup event not found", async () => {
    const contract = await import("../src/contracts/contract.js");
    contract.TokenManager.balanceOf = jest.fn().mockResolvedValue(1000n);
    contract.UIManager.connect = () => ({
      getCertificateInfo: jest.fn().mockResolvedValue({ logs: [] }),
      interface: {
        parseLog: jest.fn().mockReturnValue(null),
      },
    });

    users.push({
      username: "alice",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      walletAddress: "0xabc",
    });
    certificates.push({ certificateHash: "hash_1" });

    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "alice", certificateHash: "hash_1" });

    console.log("❌ Missing CertificateLookup event:", res.body);
    expect(res.statusCode).toBe(500);
    expect(res.body?.error).toBe("Verification failed");
    expect(res.body?.details).toMatch(/CID not found/i);
  });

  it("should return 500 if fakeIpfsCat throws", async () => {
    const contract = await import("../src/contracts/contract.js");
    contract.TokenManager.balanceOf = jest.fn().mockResolvedValue(1000n);
    contract.UIManager.connect = () => ({
      getCertificateInfo: jest
        .fn()
        .mockResolvedValue({ logs: [{ topics: [], data: "" }] }),
      interface: {
        parseLog: jest.fn().mockReturnValue({
          name: "CertificateLookup",
          args: { ipfsCid: "CID:valid123" },
        }),
      },
    });

    fakeIpfsCat.mockImplementationOnce(() => {
      throw new Error("CID not found in fake IPFS");
    });

    users.push({
      username: "alice",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      walletAddress: "0xabc",
    });
    certificates.push({ certificateHash: "hash_1" });

    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "alice", certificateHash: "hash_1" });

    console.log("❌ Fake IPFS error:", res.body);
    expect(res.statusCode).toBe(500);
    expect(res.body?.error).toBe("Verification failed");
    expect(res.body?.details).toMatch(/CID not found in fake IPFS/);
  });

  it("should return 500 if decryption fails", async () => {
    const contract = await import("../src/contracts/contract.js");
    contract.TokenManager.balanceOf = jest.fn().mockResolvedValue(1000n);
    contract.UIManager.connect = () => ({
      getCertificateInfo: jest
        .fn()
        .mockResolvedValue({ logs: [{ topics: [], data: "" }] }),
      interface: {
        parseLog: jest.fn().mockReturnValue({
          name: "CertificateLookup",
          args: { ipfsCid: "CID:valid123" },
        }),
      },
    });

    decryptObject.mockImplementationOnce(() => {
      throw new Error("decryption error");
    });

    users.push({
      username: "alice",
      privateKey:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      walletAddress: "0xabc",
    });
    certificates.push({ certificateHash: "hash_1" });

    const res = await request(app)
      .post("/api/verify/verify_certificate")
      .send({ verifierUsername: "alice", certificateHash: "hash_1" });

    console.log("❌ Decryption error:", res.body);
    expect(res.statusCode).toBe(500);
    expect(res.body?.error).toBe("Verification failed");
    expect(res.body?.details).toMatch(/decryption error/);
  });
});
