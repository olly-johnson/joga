import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import { join } from "path";
import { mkdirSync } from "fs";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const PORT = 3987;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = join(__dirname, "..", "screenshots");

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Building Expo web export...");
  execSync("npx expo export --platform web", {
    cwd: join(__dirname, "..", "apps", "mobile"),
    stdio: "inherit",
  });

  console.log("Starting static server...");
  const server = spawn(
    "npx",
    ["serve", join(__dirname, "..", "apps", "mobile", "dist"), "-l", String(PORT), "--no-clipboard"],
    { stdio: "pipe", shell: true }
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      deviceScaleFactor: 2,
      colorScheme: "dark",
    });

    // Screenshot 1: Login (Sign In mode) — the only publicly reachable screen
    // now that AuthGate redirects unauthenticated traffic. Authenticated routes
    // (venue feed, onboarding) require session injection which we can add later.
    console.log("Capturing login (sign in)...");
    const loginPage = await context.newPage();
    await loginPage.goto(`${BASE_URL}/login`, {
      waitUntil: "networkidle",
    });
    await loginPage.waitForTimeout(500);
    await loginPage.screenshot({
      path: join(OUT_DIR, "login-signin.png"),
      fullPage: false,
    });

    // Screenshot 2: Login (Sign Up mode)
    console.log("Capturing login (sign up)...");
    const signUpToggle = loginPage.getByText("Sign Up", { exact: true }).last();
    if (await signUpToggle.isVisible()) {
      await signUpToggle.click();
      await loginPage.waitForTimeout(300);
    }
    await loginPage.screenshot({
      path: join(OUT_DIR, "login-signup.png"),
      fullPage: false,
    });

    await browser.close();
    console.log(`Screenshots saved to ${OUT_DIR}`);
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
