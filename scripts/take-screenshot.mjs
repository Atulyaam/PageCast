import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const url = process.argv[2] || "http://localhost:3000";
const width = parseInt(process.argv[3] || "1280", 10);
const height = parseInt(process.argv[4] || "800", 10);
const outPath = process.argv[5] || path.resolve("docs/screenshots/test.png");

const resolvedOut = path.resolve(outPath);
fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const cmd = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --window-size=${width},${height} --screenshot="${resolvedOut}" ${url}`;

console.log("Running:", cmd);
try {
  execSync(cmd, { stdio: "inherit" });
  console.log(
    "Finished. File exists:",
    fs.existsSync(resolvedOut),
    "Size:",
    fs.statSync(resolvedOut).size
  );
} catch (e) {
  console.error("Error:", e.message);
}
