import { jest } from "@jest/globals";

let request, app;
let users, companies, certificates;

beforeAll(async () => {
  // Mock blockchain interactions
  await jest.unstable_mockModule("../src/contracts/setup.js", () => ({
    ensureDefaultCompanyWhitelisted: jest.fn(), // mocka la funzione chiamata da index.js
  }));

  // Dynamic import of database after mock
  request = (await import("supertest")).default;
  app = (await import("../index.js")).default;

  const db = await import("../database.js");
  users = db.users;
  companies = db.companies;
  certificates = db.certificates;
});

beforeEach(() => {
  users.length = 0;
  companies.length = 0;
  certificates.length = 0;
});

describe("DB Queries API", () => {
  beforeEach(() => {
    users.push({ id: "user_1", username: "alice" });
    companies.push({ id: "company_1", username: "tech_corp" });
    certificates.push(
      { userId: "user_1", certificateHash: "hash_1", cid: "cid_1", companyId: "company_1" },
      { userId: "user_1", certificateHash: "hash_2", cid: "cid_2", companyId: "company_1" }
    );
  });

  it("should return all users", async () => {
    const res = await request(app).get("/api/utils/users");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("username", "alice");
  });

  it("should return all companies", async () => {
    const res = await request(app).get("/api/utils/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("username", "tech_corp");
  });

  it("should return all users and companies together", async () => {
    const res = await request(app).get("/api/utils/all");
    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.companies).toBeDefined();
    expect(res.body.users.length).toBe(1);
    expect(res.body.companies.length).toBe(1);
  });

  it("should return all certificates for a specific user", async () => {
    const res = await request(app).get("/api/utils/user_certificates/user_1");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty("certificateHash", "hash_1");
  });

  it("should return an empty array for user with no certificates", async () => {
    const res = await request(app).get("/api/utils/user_certificates/user_999");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
