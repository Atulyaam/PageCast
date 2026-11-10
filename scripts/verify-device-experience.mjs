import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9223;

const routesToTest = [
  { name: "home_1440", url: "http://localhost:3000/", width: 1440, height: 900 },
  { name: "home_375", url: "http://localhost:3000/", width: 375, height: 812 },
  { name: "terminal_1440", url: "http://localhost:3000/terminal", width: 1440, height: 900 },
  { name: "terminal_375", url: "http://localhost:3000/terminal", width: 375, height: 812 },
  { name: "catalogue_1440", url: "http://localhost:3000/catalogue", width: 1440, height: 900 },
  { name: "saved_1440", url: "http://localhost:3000/saved", width: 1440, height: 900 },
  { name: "publisher_1440", url: "http://localhost:3000/publisher", width: 1440, height: 900 },
  {
    name: "publisher_ingest_1440",
    url: "http://localhost:3000/publisher/ingest",
    width: 1440,
    height: 900,
  },
  { name: "lab_1440", url: "http://localhost:3000/lab", width: 1440, height: 900 },
];

async function waitForCDP(proc) {
  for (let i = 0; i < 40; i++) {
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

async function main() {
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,900",
    "--disk-cache-size=0",
    "about:blank",
  ]);

  try {
    const wsUrl = await waitForCDP(chromeProc);
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    let msgId = 1;
    const pending = new Map();
    const consoleErrors = [];

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && pending.has(data.id)) {
          const { resolve, reject } = pending.get(data.id);
          pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        } else if (data.method === "Runtime.consoleAPICalled" && data.params.type === "error") {
          consoleErrors.push(data.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
        } else if (data.method === "Runtime.exceptionThrown") {
          consoleErrors.push(
            data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text
          );
        }
      } catch {
        // Ignore
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Runtime.enable");
    await send("Page.enable");
    await send("Log.enable");

    const results = [];

    for (const route of routesToTest) {
      console.log(`\nTesting ${route.name} (${route.url}) at ${route.width}x${route.height}...`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: route.width,
        height: route.height,
        deviceScaleFactor: 1,
        mobile: route.width < 600,
      });

      await send("Page.navigate", { url: route.url });
      await new Promise((r) => setTimeout(r, 4500));

      const metrics = await send("Runtime.evaluate", {
        expression: `(() => {
          const chassis = document.querySelector('.device-chassis');
          const brandPlate = document.querySelector('.device-brand-plate');
          const controlDeck = document.querySelector('.device-control-deck');
          const screenViewport = document.querySelector('.device-screen-viewport');
          const docScrollHeight = document.documentElement.scrollHeight;
          const docClientHeight = document.documentElement.clientHeight;
          const bodyScrollHeight = document.body.scrollHeight;

          const getRect = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
          };

          return {
            chassis: getRect(chassis),
            brandPlate: getRect(brandPlate),
            controlDeck: getRect(controlDeck),
            screenViewport: getRect(screenViewport),
            docScrollHeight,
            docClientHeight,
            bodyScrollHeight,
            overflowY: screenViewport ? window.getComputedStyle(screenViewport).overflowY : null,
          };
        })()`,
        returnByValue: true,
      });

      const shotPath = path.resolve(`docs/screenshots/device_${route.name}.png`);
      fs.mkdirSync(path.dirname(shotPath), { recursive: true });
      const { data: base64Data } = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(shotPath, Buffer.from(base64Data, "base64"));
      const fileSize = fs.statSync(shotPath).size;

      const evalData = metrics.result.value;
      console.log(`  Chassis Rect:`, JSON.stringify(evalData.chassis));
      console.log(`  Brand Plate Rect:`, JSON.stringify(evalData.brandPlate));
      console.log(`  Control Deck Rect:`, JSON.stringify(evalData.controlDeck));
      console.log(
        `  Viewport Overflow: ${evalData.overflowY}, Doc Scroll H: ${evalData.docScrollHeight}, Client H: ${evalData.docClientHeight}`
      );
      console.log(`  Screenshot saved: ${shotPath} (${fileSize} bytes)`);

      results.push({
        route: route.name,
        evalData,
        screenshotSize: fileSize,
      });
    }

    console.log("\n=== VALIDATION SUMMARY ===");
    console.log(`Total Routes Verified: ${results.length}`);
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log("Console Errors:", consoleErrors);
    }

    // Check desktop chassis stability
    const desktopResults = results.filter((r) => r.route.endsWith("_1440"));
    console.log("\nDesktop Chassis Stability Across Routes (1440x900):");
    const baseline = desktopResults[0].evalData.chassis;
    let stable = true;
    for (const r of desktopResults) {
      const c = r.evalData.chassis;
      const bp = r.evalData.brandPlate;
      console.log(
        `  ${r.route.padEnd(25)}: Chassis [x=${c?.x}, y=${c?.y}, w=${c?.width}, h=${c?.height}] | BrandPlate [y=${bp?.y}, h=${bp?.h || bp?.height}]`
      );
      if (c && baseline && (c.x !== baseline.x || c.width !== baseline.width)) {
        stable = false;
      }
    }
    console.log(`\nChassis Horizontal Alignment Stable: ${stable ? "YES (ZERO JUMP)" : "NO"}`);

    ws.close();
    chromeProc.kill();
  } catch (err) {
    console.error("Evaluation script error:", err);
    chromeProc.kill();
    process.exit(1);
  }
}

main();
