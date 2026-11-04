#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const outFile = path.join(root, "js", "data-bundle.js");

const files = fs
  .readdirSync(dataDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

if (!files.length) {
  console.error(`No JSON files found in ${dataDir}`);
  process.exit(1);
}

const bundle = {};
for (const file of files) {
  const name = file.replace(/\.json$/, "");
  try {
    bundle[name] = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  } catch (error) {
    console.error(`data/${file} is not valid JSON: ${error.message}`);
    process.exit(1);
  }
}

const body = `window.__SKILL_MARKET_DATA__ = ${JSON.stringify(bundle, null, 2)};\n`;

fs.writeFileSync(outFile, body, "utf8");
console.log(`Wrote js/data-bundle.js from ${files.length} file(s): ${files.join(", ")}`);
