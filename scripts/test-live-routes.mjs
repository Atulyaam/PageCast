const routes = [
  "/",
  "/terminal",
  "/catalogue",
  "/saved",
  "/lab",
  "/manifest.webmanifest",
  "/about",
  "/privacy",
  "/content-policy",
  "/publisher",
  "/publisher/ingest",
  "/api/v1/pages/100",
  "/api/v1/pages/101",
  "/api/v1/pages/102",
  "/api/v1/pages/789",
  "/api/v1/pages/999",
  "/api/v1/catalog",
];

async function run() {
  console.log("Testing live routes on http://localhost:3000 ...\n");
  let passCount = 0;
  for (const r of routes) {
    try {
      const res = await fetch("http://localhost:3000" + r);
      let expectedStatus = 200;
      if (r === "/api/v1/pages/789") expectedStatus = 404;
      if (r === "/api/v1/pages/999") expectedStatus = 400;
      const ok = res.status === expectedStatus;
      const ctype = res.headers.get("content-type") || "unknown";
      console.log(
        `[${ok ? "PASS" : "FAIL"}] ${r.padEnd(25)} -> Status: ${res.status} (expected ${expectedStatus}) | Content-Type: ${ctype}`
      );
      if (ok) passCount++;
    } catch (err) {
      console.log(`[FAIL] ${r.padEnd(25)} -> Error: ${err.message}`);
    }
  }
  console.log(`\nSummary: ${passCount}/${routes.length} routes passed.`);
}

run();
