import http from "http";

const HOST = "127.0.0.1";
const PORT = 8545;

const RETRIES = 30;
const DELAY = 500; // ms

function checkNodeReady() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        method: "POST",
        host: HOST,
        port: PORT,
        headers: {
          "Content-Type": "application/json"
        }
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => resolve(false));
    req.write(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "web3_clientVersion",
        params: [],
        id: 1
      })
    );
    req.end();
  });
}

async function waitForNode() {
  for (let i = 0; i < RETRIES; i++) {
    const ready = await checkNodeReady();
    if (ready) {
      console.log("Hardhat node is ready.");
      process.exit(0);
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, DELAY));
  }
  console.error("\nTimeout: Hardhat node not detected.");
  process.exit(1);
}

await waitForNode();
