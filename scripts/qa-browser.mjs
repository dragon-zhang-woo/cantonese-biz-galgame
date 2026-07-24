import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const chromePath =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9337;
const profile = path.join(os.tmpdir(), `cantonese-biz-qa-${Date.now()}`);
await mkdir(profile, { recursive: true });

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForTargets() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Chrome is still starting.
    }
    await delay(150);
  }
  throw new Error("Chrome DevTools endpoint did not become ready.");
}

const target = await waitForTargets();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
const events = [];
const browserErrors = [];

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }
  events.push(message);
  if (message.method === "Runtime.exceptionThrown") {
    browserErrors.push(message.params.exceptionDetails.text);
  }
  if (
    message.method === "Log.entryAdded" &&
    ["error", "warning"].includes(message.params.entry.level)
  ) {
    browserErrors.push(
      `${message.params.entry.level}: ${message.params.entry.text}`,
    );
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForEvent(method, timeoutMs = 7000) {
  const existingIndex = events.findIndex((event) => event.method === method);
  if (existingIndex >= 0) return events.splice(existingIndex, 1)[0];

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const index = events.findIndex((event) => event.method === method);
    if (index >= 0) return events.splice(index, 1)[0];
    await delay(30);
  }
  throw new Error(`Timed out waiting for ${method}`);
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile: width <= 480,
    fitWindow: false,
  });
}

async function navigate(url) {
  events.length = 0;
  await send("Page.navigate", { url });
  await waitForEvent("Page.loadEventFired");
  await delay(900);
}

async function screenshot(name) {
  const result = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const output = path.join(root, name);
  await writeFile(output, Buffer.from(result.data, "base64"));
  return output;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

const url = "http://127.0.0.1:4173/?demo=1";
await setViewport(1440, 1024);
await navigate(url);

const initial = await evaluate(`({
  scene: document.querySelector(".speaker-name")?.textContent,
  choices: document.querySelectorAll(".choice-button").length,
  mode: document.querySelector(".mode-toggle")?.textContent.trim(),
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
})`);
const desktopGameplay = await screenshot("qa-desktop.png");

await evaluate(`document.querySelector(".mode-toggle")?.click()`);
await delay(100);
const aiMode = await evaluate(`({
  label: document.querySelector(".mode-toggle")?.textContent.trim(),
  composerVisible: Boolean(document.querySelector(".free-response-form")),
  submitDisabled: document.querySelector(".free-response-field button")?.disabled
})`);
const desktopAiComposer = await screenshot("qa-ai-composer.png");
await evaluate(`document.querySelector(".mode-toggle")?.click()`);
await delay(100);

const visited = [];
let desktopCinematic;
for (let act = 0; act < 5; act += 1) {
  visited.push(
    await evaluate(`document.querySelector(".speaker-name")?.textContent`),
  );
  await evaluate(`document.querySelector(".choice-button")?.click()`);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ready = await evaluate(
      `Boolean(document.querySelector(".continue-button"))`,
    );
    if (ready) break;
    await delay(100);
  }
  await evaluate(`document.querySelector(".continue-button")?.click()`);
  await delay(120);
  if (act === 0) {
    desktopCinematic = await screenshot("qa-cinematic.png");
  }

  for (let shot = 0; shot < 5; shot += 1) {
    const advanceLabel = await evaluate(
      `document.querySelector(".aftermath-nav--primary")?.textContent.trim()`,
    );
    if (!advanceLabel) {
      throw new Error(`Act ${act + 1} did not open its consequence sequence.`);
    }
    await evaluate(
      `document.querySelector(".aftermath-nav--primary")?.click()`,
    );
    await delay(80);
    if (
      advanceLabel.includes("进入下一幕") ||
      advanceLabel.includes("查看学习报告")
    ) {
      break;
    }
  }

  if (act < 4) {
    const preludeVisible = await evaluate(
      `Boolean(document.querySelector(".prelude-cta"))`,
    );
    if (!preludeVisible) {
      throw new Error(`Act ${act + 2} did not open its establishing shot.`);
    }
    await evaluate(`document.querySelector(".prelude-cta")?.click()`);
    await delay(80);
  }
}

const ending = await evaluate(`({
  visible: Boolean(document.querySelector(".ending-card")),
  title: document.querySelector(".ending-card h2")?.textContent,
  reportItems: document.querySelectorAll(".learning-report li").length
})`);
const desktopEnding = await screenshot("qa-ending.png");

await setViewport(390, 844);
await navigate(url);
await evaluate(`document.querySelector(".mode-toggle")?.click()`);
await delay(100);
const mobile = await evaluate(`({
  width: window.innerWidth,
  height: window.innerHeight,
  choices: document.querySelectorAll(".choice-button").length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  dialogueVisible: Boolean(document.querySelector(".dialogue-console")),
  composerVisible: Boolean(document.querySelector(".free-response-form")),
  composerWidth: Math.round(document.querySelector(".free-response-form")?.getBoundingClientRect().width ?? 0)
})`);
const mobileGameplay = await screenshot("qa-mobile.png");
await evaluate(`document.querySelector(".mode-toggle")?.click()`);
await delay(80);

await evaluate(`document.querySelector('[aria-label="查看人物档案"]')?.click()`);
await delay(100);
const mobileDossier = await evaluate(`({
  visible: Boolean(document.querySelector(".dossier-shell")),
  width: Math.round(document.querySelector(".dossier-shell")?.getBoundingClientRect().width ?? 0),
  imageLoaded: (document.querySelector(".dossier-content img")?.naturalWidth ?? 0) > 0,
  tabs: document.querySelectorAll(".dossier-tabs button").length,
  bodyLocked: document.body.style.overflow === "hidden"
})`);
const mobileDossierShot = await screenshot("qa-mobile-dossier.png");
await evaluate(`document.querySelector('[aria-label="关闭人物档案"]')?.click()`);
await delay(80);

await evaluate(`document.querySelector(".choice-button")?.click()`);
for (let attempt = 0; attempt < 40; attempt += 1) {
  const ready = await evaluate(
    `Boolean(document.querySelector(".continue-button"))`,
  );
  if (ready) break;
  await delay(100);
}
await evaluate(`document.querySelector(".continue-button")?.click()`);
await delay(120);
const mobileCinematic = await evaluate(`({
  visible: Boolean(document.querySelector(".aftermath-shell")),
  width: Math.round(document.querySelector(".aftermath-shell")?.getBoundingClientRect().width ?? 0),
  imageLoaded: (document.querySelector(".reaction-frame img")?.naturalWidth ?? 0) > 0,
  bodyLocked: document.body.style.overflow === "hidden"
})`);
const mobileCinematicShot = await screenshot("qa-mobile-cinematic.png");

socket.close();
chrome.kill();

const summary = {
  initial,
  aiMode,
  visited,
  ending,
  mobile,
  mobileDossier,
  mobileCinematic,
  browserErrors,
  screenshots: {
    desktopGameplay,
    desktopAiComposer,
    desktopCinematic,
    desktopEnding,
    mobileGameplay,
    mobileDossier: mobileDossierShot,
    mobileCinematic: mobileCinematicShot,
  },
};

console.log(JSON.stringify(summary, null, 2));

if (
  initial.choices !== 2 ||
  initial.overflow ||
  !aiMode.label.includes("AI 即兴") ||
  !aiMode.composerVisible ||
  aiMode.submitDisabled !== true ||
  visited.length !== 5 ||
  !ending.visible ||
  ending.reportItems !== 5 ||
  mobile.width !== 390 ||
  mobile.overflow ||
  mobile.choices !== 2 ||
  !mobile.composerVisible ||
  mobile.composerWidth > 370 ||
  !mobileDossier.visible ||
  mobileDossier.width > 374 ||
  !mobileDossier.imageLoaded ||
  mobileDossier.tabs !== 4 ||
  !mobileDossier.bodyLocked ||
  !mobileCinematic.visible ||
  mobileCinematic.width > 374 ||
  !mobileCinematic.imageLoaded ||
  !mobileCinematic.bodyLocked ||
  browserErrors.length > 0
) {
  process.exitCode = 1;
}
