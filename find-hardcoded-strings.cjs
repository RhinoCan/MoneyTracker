#!/usr/bin/env node
/**
 * find-hardcoded-strings.js
 * Scans src/ for hardcoded strings that should probably be i18n translation keys.
 * Run from project root: node find-hardcoded-strings.js
 * Output: hardcoded-strings-report.txt
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = "./src";
const OUTPUT_FILE = "./hardcoded-strings-report.txt";
const EXTENSIONS = [".vue", ".ts", ".tsx"];

// Patterns to search for, each with a description
const PATTERNS = [
  {
    name: "Template label prop (hardcoded)",
    regex: /label="([^"]+)"/g,
    excludePattern: /label=""/,
  },
  {
    name: "Template title prop (hardcoded)",
    regex: /title="([^"]+)"/g,
    excludePattern: null,
  },
  {
    name: "Template placeholder prop (hardcoded)",
    regex: /placeholder="([^"]+)"/g,
    excludePattern: null,
  },
  {
    name: "Template hint prop (hardcoded)",
    regex: /hint="([^"]+)"/g,
    excludePattern: null,
  },
  {
    name: "Template text prop (hardcoded)",
    regex: /\btext="([A-Z][^"]+)"/g,
    excludePattern: null,
  },
  {
    name: "Template text node (hardcoded)",
    regex: />\s*([A-Z][a-zA-Z\s]{3,})\s*</g,
    excludePattern: null,
  },
  {
    name: "Logger call with hardcoded string",
    regex: /log(?:Exception|Success|Warning|Validation|Info)\(\s*["']([A-Z][^"']+)["']/g,
    excludePattern: null,
  },
  {
    name: "logException slug with hardcoded string",
    regex: /slug:\s*["']([A-Z][^"']+)["']/g,
    excludePattern: null,
  },
];

// Patterns to SKIP — these are false positives we don't care about
const SKIP_PATTERNS = [
  /^mdi-/, // icon names
  /^v-/, // vue/vuetify directives
  /^\$/, // variables
  /^#/, // colors
  /^[a-z]/, // lowercase (likely technical identifiers)
  /^\d/, // numbers
  /^YYYY/, // date formats
  /^[A-Z]{2,}$/, // all-caps constants
];

function shouldSkip(match) {
  return SKIP_PATTERNS.some((p) => p.test(match.trim()));
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      getAllFiles(fullPath, files);
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const results = [];

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const matchedText = match[1]?.trim();
      if (!matchedText || shouldSkip(matchedText)) continue;
      if (pattern.excludePattern && pattern.excludePattern.test(match[0])) continue;

      // Find line number
      const upToMatch = content.substring(0, match.index);
      const lineNumber = upToMatch.split("\n").length;
      const lineContent = lines[lineNumber - 1]?.trim();

      results.push({
        pattern: pattern.name,
        match: matchedText,
        line: lineNumber,
        context: lineContent,
      });
    }
  }

  return results;
}

function run() {
  console.log(`Scanning ${SRC_DIR} for hardcoded strings...`);
  const files = getAllFiles(SRC_DIR);
  const output = [];
  let totalHits = 0;

  output.push("HARDCODED STRINGS REPORT");
  output.push("========================");
  output.push(`Generated: ${new Date().toLocaleString()}`);
  output.push(`Files scanned: ${files.length}`);
  output.push("");

  for (const filePath of files) {
    const results = searchFile(filePath);
    if (results.length === 0) continue;

    output.push(`FILE: ${filePath}`);
    output.push("-".repeat(60));

    for (const result of results) {
      output.push(`  [${result.pattern}]`);
      output.push(`  Line ${result.line}: ${result.context}`);
      output.push(`  Matched: "${result.match}"`);
      output.push("");
      totalHits++;
    }
  }

  output.push("========================");
  output.push(`Total potential hardcoded strings found: ${totalHits}`);

  fs.writeFileSync(OUTPUT_FILE, output.join("\n"), "utf8");
  console.log(`Done. Found ${totalHits} potential hardcoded strings.`);
  console.log(`Report written to: ${OUTPUT_FILE}`);
}

run();
