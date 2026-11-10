import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9222;
const url = process.argv[2] || "http://localhost:3000";
const width = parseInt(process.argv[3] || "1440", 10);
const height = parseInt(process.argv[4] || "900", 10);
const screenshotPath = process.argv[5];

const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--disable-gpu",
  "--no-sandbox",
  `--window-size=${width},${height}`,
  "--disk-cache-size=0",
  "about:blank",
]);

async function waitForCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const tabs = await res.json();
      if (tabs && tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        return tabs[0].webSocketDebuggerUrl;
      }
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Could not connect to Chrome CDP");
}

async function run() {
  const wsUrl = await waitForCDP();
  const ws = new WebSocket(wsUrl);

  const consoleLogs = [];
  const errors = [];

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      } else if (data.method === "Runtime.consoleAPICalled") {
        const type = data.params.type;
        const text = data.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
        consoleLogs.push({ type, text });
        if (type === "error") errors.push(text);
      } else if (data.method === "Runtime.exceptionThrown") {
        const desc =
          data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text;
        errors.push(desc);
      }
    } catch {
      // Ignore
    }
  };

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });

  await send("Page.navigate", { url });
  // Allow time for compile, hydration, and frame rendering
  await new Promise((r) => setTimeout(r, 4000));

  const evalResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const main = document.querySelector('main');
      const brandPlate = document.querySelector('.device-brand-plate');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      return {
        mainClasses: main ? main.className : null,
        brandPlateExists: !!brandPlate,
        bodyBg,
        title: document.title,
      };
    })()`,
    returnByValue: true,
  });

  if (screenshotPath) {
    const resolvedPath = path.resolve(screenshotPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    const { data: base64Data } = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(resolvedPath, Buffer.from(base64Data, "base64"));
    console.log("Saved screenshot:", resolvedPath, fs.statSync(resolvedPath).size, "bytes");
  }

  console.log("DOM Evaluation:", JSON.stringify(evalResult.result.value, null, 2));
  console.log("Console Errors Count:", errors.length);
  if (errors.length > 0) {
    console.log("Errors:", errors);
  }
  console.log("Total Console Logs:", consoleLogs.length);

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error("Run error:", e);
  chromeProc.kill();
  process.exit(1);
});
