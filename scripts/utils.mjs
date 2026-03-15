import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
export const TARGETS_DIR = path.join(ROOT_DIR, "targets");
export const OUTPUT_DIR = path.join(ROOT_DIR, "output");

export function log(message) {
  console.log(`[repo-shot] ${message}`);
}

export function logError(message, error) {
  console.error(`[repo-shot] ${message}`);

  if (error instanceof Error && error.message) {
    console.error(`[repo-shot] ${error.message}`);
    return;
  }

  if (error) {
    console.error(`[repo-shot] ${String(error)}`);
  }
}

export function formatRelativePath(targetPath) {
  const relativePath = path.relative(ROOT_DIR, targetPath) || path.basename(targetPath);
  return relativePath.split(path.sep).join("/");
}

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export function getTargetConfigPath(targetName) {
  return path.join(TARGETS_DIR, `${targetName}.json`);
}

export function getProjectOutputDir(projectName) {
  return path.join(OUTPUT_DIR, projectName);
}

export function getScreenshotPath(projectName, pageName) {
  return path.join(getProjectOutputDir(projectName), `${pageName}.png`);
}

export function getReadmeSectionPath(projectName) {
  return path.join(getProjectOutputDir(projectName), "README-section.md");
}

export function buildPageUrl(baseUrl, pagePath) {
  return new URL(pagePath, baseUrl).toString();
}

export async function loadTargetConfig(targetName) {
  if (!targetName) {
    throw new Error("타깃 이름이 필요합니다. 예: node scripts/capture.mjs example");
  }

  const configPath = getTargetConfigPath(targetName);
  let rawContent;

  try {
    rawContent = await fs.readFile(configPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `타깃 설정 파일을 찾을 수 없습니다: ${formatRelativePath(configPath)}`
      );
    }

    throw error;
  }

  let parsedConfig;

  try {
    parsedConfig = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`JSON 파싱에 실패했습니다: ${formatRelativePath(configPath)}`);
  }

  validateTargetConfig(parsedConfig, configPath);
  return parsedConfig;
}

function validateTargetConfig(config, configPath) {
  assertPlainObject(config, "설정 파일 최상위 객체", configPath);
  assertNonEmptyString(config.project, "project", configPath);
  assertNonEmptyString(config.baseUrl, "baseUrl", configPath);
  assertPlainObject(config.viewport, "viewport", configPath);
  assertPositiveInteger(config.viewport.width, "viewport.width", configPath);
  assertPositiveInteger(config.viewport.height, "viewport.height", configPath);

  if (!Array.isArray(config.pages) || config.pages.length === 0) {
    throw new Error(
      `pages는 최소 1개 이상의 항목이 있는 배열이어야 합니다: ${formatRelativePath(configPath)}`
    );
  }

  for (const [index, page] of config.pages.entries()) {
    const pageLabel = `pages[${index}]`;
    assertPlainObject(page, pageLabel, configPath);
    assertNonEmptyString(page.name, `${pageLabel}.name`, configPath);
    assertNonEmptyString(page.title, `${pageLabel}.title`, configPath);
    assertNonEmptyString(page.path, `${pageLabel}.path`, configPath);
    assertNonEmptyString(page.description, `${pageLabel}.description`, configPath);

    if (page.waitFor !== undefined) {
      assertWaitFor(page.waitFor, `${pageLabel}.waitFor`, configPath);
    }
  }
}

function assertPlainObject(value, fieldName, configPath) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName}는 객체여야 합니다: ${formatRelativePath(configPath)}`);
  }
}

function assertNonEmptyString(value, fieldName, configPath) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${fieldName}는 비어 있지 않은 문자열이어야 합니다: ${formatRelativePath(configPath)}`
    );
  }
}

function assertPositiveInteger(value, fieldName, configPath) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `${fieldName}는 0보다 큰 정수여야 합니다: ${formatRelativePath(configPath)}`
    );
  }
}

function assertWaitFor(value, fieldName, configPath) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${fieldName}는 0 이상의 정수여야 합니다: ${formatRelativePath(configPath)}`
    );
  }
}
