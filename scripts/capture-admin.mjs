import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const outputDir = join(__dirname, "..", "output", "vibe-rec");

const BASE_URL = "http://localhost:3000";
const LOGIN_API = "http://localhost:8083/api/v1/admin/auth/login";

const adminPages = [
  {
    name: "admin-dashboard",
    title: "운영자 대시보드",
    path: "/admin",
    description: "관리자 로그인 후 진입하는 대시보드. 공고 현황과 지원자 관리 메뉴를 제공한다.",
  },
  {
    name: "admin-applicants",
    title: "지원자 목록",
    path: "/admin/applicants",
    description: "공고별·상태별 필터와 이름/이메일 검색으로 지원자를 조회한다.",
  },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

// Login via API to get session cookie
console.log("[repo-shot] Logging in as admin...");
const loginResponse = await page.request.post(LOGIN_API, {
  data: { username: "admin", password: "admin" },
});

if (!loginResponse.ok()) {
  console.error("[repo-shot] Login failed:", loginResponse.status());
  await browser.close();
  process.exit(1);
}

// Navigate to admin to set cookies via the app
await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);

// Fill login form and submit through the UI
await page.fill('input[name="username"], input[type="text"]', "admin");
await page.fill('input[name="password"], input[type="password"]', "admin");
await page.click('button[type="submit"]');
await page.waitForTimeout(2000);

for (const entry of adminPages) {
  const url = `${BASE_URL}${entry.path}`;
  console.log(`[repo-shot] Opening ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const screenshotPath = join(outputDir, `${entry.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[repo-shot] Screenshot saved: ${screenshotPath}`);
}

await browser.close();
console.log("[repo-shot] Admin capture done.");
