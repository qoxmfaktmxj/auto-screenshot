import { chromium } from "playwright";
import { formatRelativePath, buildPageUrl, ensureDir, getProjectOutputDir, getScreenshotPath, loadTargetConfig, log, logError } from "./utils.mjs";
import { writeReadmeSection } from "./generate-readme.mjs";

async function main() {
  const targetName = process.argv[2];
  const config = await loadTargetConfig(targetName);

  log(`Starting capture for project: ${config.project}`);

  const outputDir = getProjectOutputDir(config.project);
  await ensureDir(outputDir);

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: config.viewport
    });
    const page = await context.newPage();

    for (const pageConfig of config.pages) {
      const pageUrl = buildPageUrl(config.baseUrl, pageConfig.path);
      const screenshotPath = getScreenshotPath(config.project, pageConfig.name);

      log(`Opening ${pageUrl}`);
      await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

      if (pageConfig.waitFor !== undefined) {
        await page.waitForTimeout(pageConfig.waitFor);
      }

      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      log(`Screenshot saved: ${formatRelativePath(screenshotPath)}`);
    }

    await context.close();

    const readmePath = await writeReadmeSection(config);
    log(`README section generated: ${formatRelativePath(readmePath)}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  logError("Capture failed.", error);
  process.exitCode = 1;
});
