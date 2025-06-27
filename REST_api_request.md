# 📡 SmartCV API – POSTMAN Request List

## 🔐 Auth – Register

### ➕ Register Candidate
**POST** `http://localhost:5000/api/auth/register/candidate`

```json
{
  "username": "demo_user"
}
```

---

### ➕ Register Company
**POST** `http://localhost:5000/api/auth/register/company`

```json
{
  "username": "demo_company"
}
```

---

## 🧾 Claim Lifecycle

### 📝 Create Claim
**POST** `http://localhost:5000/api/claim/create_claim`

```json
{
  "username": "demo_user",
  "company": "demo_company",
  "role": "Software Engineer",
  "startDate": "2023-01-01",
  "endDate": "2024-01-01",
  "description": "Worked on smart contracts and DApps"
}
```

---

### 📥 Get Pending claim (by company ID)
**GET** `http://localhost:5000/api/claim/pending/company0`

---

### ✅ Approve Claim
**POST** `http://localhost:5000/api/claim/approve_claim`

```json
{
  "companyUsername": "demo_company",
  "claimId": "claim_1"
}
```

---

### ❌ Reject Claim
**POST** `http://localhost:5000/api/claim/reject_claim`

```json
{
  "companyUsername": "demo_company",
  "claimId": "claim_2"
}
```

---

## 💰 Token Management

### 💸 Mint Tokens to User (onlyOwner)
**POST** `http://localhost:5000/api/token/fund_user`

```json
{
  "username": "demo_user",
  "amount": "50"
}
```

---

## 🔍 Certificate Verification

### 🔐 Verify Certificate (with token deduction)
**POST** `http://localhost:5000/api/verify/verify_certificate`

```json
{
  "verifierUsername": "demo_user",
  "certificateHash": "PASTE_CERTIFICATE_HASH_HERE"
}
```

---

## 🧪 Optional Utility (balance check)

### 📊 Get Token Balance
**GET** `http://localhost:5000/api/token/balance/demo_user`

(no body needed)

---

## ✅ Expected Responses

### `create_claim`:
```json
{
  "status": "claim_created",
  "claimId": "claim_1"
}
```

### `approve_claim`:
```json
{
  "status": "certificate_stored",
  "certificateHash": "...",
  "cid": "..."
}
```

### `verify_certificate` (success):
```json
{
  "verified": true,
  "certificate": {
    "claim": { ... },
    "userSignature": "...",
    "certifierSignature": "..."
  }
}
```

### `verify_certificate` (not enough tokens):
```json
{
  "error": "Insufficient tokens for lookup"
}
```
