/**
 * Inlines every data/*.json file into js/data-bundle.js so the pages also
 * work when opened straight from disk (file:// blocks fetch() of local files).
 *
 * Usage: node tools/build-data.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const outFile = path.join(root, "js", "data-bundle.js");

const files = fs
  .readdirSync(dataDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

if (!files.length) {
  console.error("No data/*.json files found.");
  process.exit(1);
}

const bundle = {};

for (const file of files) {
  const name = path.basename(file, ".json");
  const source = fs.readFileSync(path.join(dataDir, file), "utf8");
  try {
    bundle[name] = JSON.parse(source);
  } catch (error) {
    console.error(`data/${file} is not valid JSON: ${error.message}`);
    process.exit(1);
  }
}

const output = `window.__SKILL_MARKET_DATA__ = ${JSON.stringify(bundle, null, 2)};\n`;
fs.writeFileSync(outFile, output, "utf8");

console.log(`Wrote ${path.relative(root, outFile)} with: ${files.join(", ")}`);
