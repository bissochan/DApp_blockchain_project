import { jest } from "@jest/globals";

let request, app;
let users, companies, admins;

beforeAll(async () => {
  await jest.unstable_mockModule("../src/contracts/contract.js", () => ({
    UIManager: {
      connect: () => ({
        buyTokens: jest.fn().mockResolvedValue({
          hash: "0xMOCK_BUY",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        transferTokens: jest.fn().mockResolvedValue({
          hash: "0xMOCK_TRANSFER",
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      }),
      getUserTokenBalance: jest.fn().mockResolvedValue(1000n),
      isWhitelisted: jest.fn().mockResolvedValue(true),
    },
    TokenManager: {},
    masterWallet: {
      address: "0xmasterwallet",
      privateKey: "0xprivatemock",
    },
    provider: {},
  }));

  await jest.unstable_mockModule("../src/contracts/txQueue.js", () => ({
    enqueueTxForWallet: async (_, fn) => await fn(0),
  }));

  request = (await import("supertest")).default;
  app = (await import("../index.js")).default;

  const db = await import("../database.js");
  users = db.users;
  companies = db.companies;
  admins = db.admins;
});

beforeEach(() => {
  users.length = 0;
  companies.length = 0;
  admins.length = 0;
});

describe("Token API - Positive cases", () => {
  const user = {
    id: "user1",
    username: "alice",
    walletAddress: "0xabc",
  };

  beforeEach(() => {
    users.push({ ...user });
  });

  it("should fund tokens to a user", async () => {
    const res = await request(app)
      .post("/api/token/fund_user")
      .send({ username: "alice" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "tokens_bought_and_transferred");
    expect(res.body).toHaveProperty("tokenAmount", 100);
    expect(res.body).toHaveProperty("toWallet", user.walletAddress);
  });

  it("should return token balance", async () => {
    const res = await request(app)
      .post("/api/token/get_balance")
      .send({ username: "alice" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("balance", "1000");
  });
});

describe("Token API - Negative cases", () => {
  it("should return 404 if user not found (fund)", async () => {
    const res = await request(app)
      .post("/api/token/fund_user")
      .send({ username: "ghost" });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });

  it("should return 404 if user not found (balance)", async () => {
    const res = await request(app)
      .post("/api/token/get_balance")
      .send({ username: "ghost" });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });

  it("should handle error in buyTokens or transferTokens", async () => {
    const { UIManager } = await import("../src/contracts/contract.js");

    users.push({ id: "user1", username: "alice", walletAddress: "0xabc" });

    UIManager.connect = () => ({
      buyTokens: () => {
        throw new Error("Buy error");
      },
      transferTokens: () => {
        throw new Error("Transfer error");
      },
    });

    const res = await request(app)
      .post("/api/token/fund_user")
      .send({ username: "alice" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Token purchase failed");
  });

  it("should handle error in getUserTokenBalance", async () => {
    const contract = await import("../src/contracts/contract.js");

    users.push({ id: "user1", username: "alice", walletAddress: "0xabc" });

    contract.UIManager.getUserTokenBalance = () => {
      throw new Error("Balance fetch failed");
    };

    const res = await request(app)
      .post("/api/token/get_balance")
      .send({ username: "alice" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Errore nel recupero balance");
  });
});
