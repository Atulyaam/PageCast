#!/usr/bin/env node

/**
 * PageCast Environment & Secret Isolation Safety Validator (TASK-S0-06)
 *
 * Verifies that:
 * 1. .env.example exists and contains all required variables.
 * 2. No server-only secrets have a NEXT_PUBLIC_ prefix.
 * 3. No actual secrets/credentials exist in .env.example (placeholders only).
 * 4. Git ignores .env and .env.local while tracking .env.example.
 * 5. No secret env files are currently tracked in Git.
 * 6. Client code does not reference privileged server secrets.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const envExamplePath = path.join(rootDir, ".env.example");

let errorsFound = 0;

function reportPass(message) {
  console.log(`[PASS] ${message}`);
}

function reportFail(message) {
  console.error(`[FAIL] ${message}`);
  errorsFound++;
}

console.log("=== PageCast Environment Safety Check ===\n");

// 1. Check .env.example exists
if (!fs.existsSync(envExamplePath)) {
  reportFail(".env.example does not exist in root directory.");
  process.exit(1);
} else {
  reportPass(".env.example exists.");
}

const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");
const envLines = envExampleContent
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

const envMap = new Map();
for (const line of envLines) {
  const eqIdx = line.indexOf("=");
  if (eqIdx !== -1) {
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    envMap.set(key, val);
  }
}

// 2. Check required variables
const requiredVars = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "PAGECAST_AI_PROVIDER",
  "PAGECAST_AI_MODEL",
  "PAGECAST_PROMPT_VERSION",
  "PAGECAST_MAX_PACK_BYTES",
  "PAGECAST_MAX_SOURCE_BYTES",
  "PAGECAST_FETCH_TIMEOUT_MS",
  "PAGECAST_MAX_REDIRECTS",
  "PAGECAST_ALLOWED_SOURCE_HOSTS",
];

for (const reqVar of requiredVars) {
  if (envMap.has(reqVar)) {
    reportPass(`Required variable present: ${reqVar}`);
  } else {
    reportFail(`Missing required variable in .env.example: ${reqVar}`);
  }
}

// 3. Ensure no server-only secrets have NEXT_PUBLIC_ prefix
const serverOnlySecretRoots = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "SERVICE_ROLE",
  "API_KEY",
  "SECRET",
];

for (const key of envMap.keys()) {
  if (key.startsWith("NEXT_PUBLIC_")) {
    const withoutPrefix = key.replace("NEXT_PUBLIC_", "");
    for (const secretRoot of serverOnlySecretRoots) {
      if (
        withoutPrefix.includes(secretRoot) &&
        !key.includes("ANON_KEY") &&
        !key.includes("APP_URL")
      ) {
        reportFail(`Server-only secret improperly prefixed with NEXT_PUBLIC_: ${key}`);
      }
    }
  }
}
reportPass("No server-only secrets carry a NEXT_PUBLIC_ prefix.");

// 4. Ensure no real secrets in .env.example (only placeholders)
const suspiciousSecretPatterns = [
  /^eyJ[a-zA-Z0-9_-]{20,}/, // JWT token
  /^AIza[a-zA-Z0-9_-]{20,}/, // Google API key
  /^sk-[a-zA-Z0-9_-]{20,}/, // OpenAI/Secret key
  /^[a-f0-9]{32,64}$/i, // Hex secret
];

for (const [key, val] of envMap.entries()) {
  for (const pattern of suspiciousSecretPatterns) {
    if (pattern.test(val)) {
      reportFail(`Suspicious real secret pattern detected for ${key} in .env.example!`);
    }
  }
}
reportPass(".env.example contains only non-sensitive placeholders.");

// 5 & 6. Verify Git ignore rules for .env and .env.local
try {
  const checkIgnoreEnv = execSync("git check-ignore .env", { stdio: "pipe" }).toString().trim();
  const checkIgnoreLocal = execSync("git check-ignore .env.local", { stdio: "pipe" })
    .toString()
    .trim();

  if (checkIgnoreEnv === ".env" && checkIgnoreLocal === ".env.local") {
    reportPass(".env and .env.local are properly ignored by Git.");
  } else {
    reportFail(`.env or .env.local check-ignore mismatch: ${checkIgnoreEnv}, ${checkIgnoreLocal}`);
  }
} catch {
  reportFail("Failed to verify git check-ignore for .env / .env.local");
}

try {
  let isExampleIgnored = false;
  try {
    execSync("git check-ignore .env.example", { stdio: "pipe" });
    isExampleIgnored = true;
  } catch {
    // Expected: non-zero exit means NOT ignored
    isExampleIgnored = false;
  }

  if (!isExampleIgnored) {
    reportPass(".env.example is tracked and not ignored by Git.");
  } else {
    reportFail(".env.example is unexpectedly ignored by Git!");
  }
} catch (err) {
  reportFail(`Error verifying .env.example git tracking: ${err.message}`);
}

// 7. Verify no tracked .env files in Git index
try {
  const trackedFiles = execSync("git ls-files", { stdio: "pipe" })
    .toString()
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const leakedTracked = trackedFiles.filter(
    (file) =>
      file === ".env" ||
      file.endsWith(".local") ||
      (file.startsWith(".env.") && file !== ".env.example")
  );

  if (leakedTracked.length === 0) {
    reportPass("No sensitive environment credential files tracked in Git.");
  } else {
    reportFail(`Secret environment files tracked in Git: ${leakedTracked.join(", ")}`);
  }
} catch (err) {
  reportFail(`Error checking git tracked files: ${err.message}`);
}

// 8. Verify private server secrets are not referenced in client components
const clientDirs = [path.join(rootDir, "src", "components"), path.join(rootDir, "src", "app")];
const forbiddenInClient = [
  "process.env.SUPABASE_SERVICE_ROLE_KEY",
  "process.env.GOOGLE_GENERATIVE_AI_API_KEY",
];

function scanDirectoryForForbiddenStrings(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "api") {
        // Exclude server-side API routes
        scanDirectoryForForbiddenStrings(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const forbidden of forbiddenInClient) {
        if (content.includes(forbidden)) {
          reportFail(
            `Forbidden server secret reference found in client file: ${fullPath} (${forbidden})`
          );
        }
      }
    }
  }
}

for (const dir of clientDirs) {
  scanDirectoryForForbiddenStrings(dir);
}
reportPass("No server secrets referenced in client application directories.");

console.log("\n==========================================");
if (errorsFound > 0) {
  console.error(`Safety check completed with ${errorsFound} error(s).`);
  process.exit(1);
} else {
  console.log("All environment safety checks passed successfully!");
  process.exit(0);
}
