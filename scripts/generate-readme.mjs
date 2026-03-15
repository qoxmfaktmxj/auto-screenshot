import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureDir,
  formatRelativePath,
  getProjectOutputDir,
  getReadmeSectionPath,
  loadTargetConfig,
  log,
  logError
} from "./utils.mjs";

export function buildReadmeSection(config) {
  const sections = ["## 화면 예시"];

  for (const page of config.pages) {
    sections.push("");
    sections.push(`### ${page.title}`);
    sections.push("");
    sections.push(page.description);
    sections.push("");
    sections.push(`![${page.title}](./${page.name}.png)`);
  }

  return `${sections.join("\n")}\n`;
}

export async function writeReadmeSection(config) {
  const outputDir = getProjectOutputDir(config.project);
  const readmePath = getReadmeSectionPath(config.project);

  await ensureDir(outputDir);
  await fs.writeFile(readmePath, buildReadmeSection(config), "utf8");

  return readmePath;
}

async function main() {
  const targetName = process.argv[2];
  const config = await loadTargetConfig(targetName);
  const readmePath = await writeReadmeSection(config);

  log(`README section generated: ${formatRelativePath(readmePath)}`);
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    logError("README section 생성에 실패했습니다.", error);
    process.exitCode = 1;
  });
}
