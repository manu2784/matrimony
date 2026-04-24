const fs = require("fs");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const repoRoot = process.cwd();
const prettierBin = path.join(
  repoRoot,
  "web",
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs",
);

const supportedExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
]);

function shouldIgnoreFile(file) {
  const normalizedFile = file.replace(/\\/g, "/");

  return (
    normalizedFile.startsWith("scripts/") ||
    normalizedFile.includes("/node_modules/") ||
    normalizedFile.startsWith("node_modules/")
  );
}

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  if (!output) return [];

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !shouldIgnoreFile(file))
    .filter((file) => supportedExtensions.has(path.extname(file)))
    .filter((file) => fs.existsSync(path.join(repoRoot, file)));
}

function ensurePrettierExists() {
  if (!fs.existsSync(prettierBin)) {
    throw new Error(
      "Prettier was not found at web/node_modules/prettier/bin/prettier.cjs",
    );
  }
}

function formatFiles(files) {
  if (files.length === 0) return;

  execFileSync("node", [prettierBin, "--write", ...files], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function restageFiles(files) {
  if (files.length === 0) return;

  execFileSync("git", ["add", "--", ...files], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function findAddedConsoleStatements(files) {
  if (files.length === 0) return [];

  const diff = execFileSync(
    "git",
    ["diff", "--cached", "--unified=0", "--", ...files],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  const matches = [];
  let currentFile = "";

  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6);
      continue;
    }

    if (
      currentFile &&
      /^\+\s*console\.[A-Za-z_$][\w$]*\s*\(/.test(line) &&
      !line.startsWith("+++")
    ) {
      matches.push({ file: currentFile, diffLine: line });
    }
  }

  return matches;
}

function main() {
  const files = getStagedFiles();

  if (files.length === 0) {
    process.exit(0);
  }

  ensurePrettierExists();
  formatFiles(files);
  restageFiles(files);

  const addedConsoleStatements = findAddedConsoleStatements(files);

  if (addedConsoleStatements.length > 0) {
    console.error(
      "Commit blocked: newly added console statements were found in staged changes.",
    );

    for (const entry of addedConsoleStatements) {
      console.error(`${entry.file}: ${entry.diffLine}`);
    }

    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
