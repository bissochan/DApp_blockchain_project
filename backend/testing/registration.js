import fetch from "node-fetch";

async function registerUsers() {
  // Register 2 companies
  for (let i = 1; i <= 2; i++) {
    const res = await fetch("http://localhost:5000/api/auth/register/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: `company${i}`, password: `pass${i}` }),
    });
    const data = await res.json();
    console.log(`Company${i} registered:`, data);
  }

  // Register 3 candidates
  for (let i = 1; i <= 3; i++) {
    const res = await fetch("http://localhost:5000/api/auth/register/candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: `user${i}`, password: `pass${i}` }),
    });
    const data = await res.json();
    console.log(`User${i} registered:`, data);
  }
}

registerUsers();
