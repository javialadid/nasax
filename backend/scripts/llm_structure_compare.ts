import fs from 'fs';
import path from 'path';
import { extractDonkiDataWithLLM } from '../services/llm';

const TEST_REPORTS_DIR = path.join(__dirname, '../test_reports');
const JSON_OUTPUT_DIR = path.join(__dirname, '../test_reports/json');

// Recursively collect all key paths in an object (e.g., a.b.c)
function collectKeyPaths(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();
  if (typeof obj !== 'object' || obj === null) return keys;
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    keys.add(fullPath);
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      for (const subKey of collectKeyPaths(obj[key], fullPath)) {
        keys.add(subKey);
      }
    }
  }
  return keys;
}

function getRootKeys(obj: any): Set<string> {
  if (typeof obj !== 'object' || obj === null) return new Set();
  return new Set(Object.keys(obj));
}

function printReadableReport(file: string, missing: string[], extra: string[], type: 'root' | 'deep') {
  console.log(`\n===== Comparison Report for: ${file} =====`);
  if (missing.length) {
    console.log(`❌ Missing ${type === 'root' ? 'root' : ''} keys:`);
    for (const k of missing) console.log(`   - ${k}`);
  }
  if (extra.length) {
    console.log(`⚠️ Extra ${type === 'root' ? 'root' : ''} keys:`);
    for (const k of extra) console.log(`   - ${k}`);
  }
  if (!missing.length && !extra.length) {
    console.log('✅ All keys present.');
  }
  console.log('========================================\n');
}

async function runLLMExtractionAndCompare() {
  // Ensure output directory exists
  if (!fs.existsSync(JSON_OUTPUT_DIR)) {
    fs.mkdirSync(JSON_OUTPUT_DIR);
  }
  const files = fs.readdirSync(TEST_REPORTS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  const results: { file: string, keys: Set<string>, rootKeys: Set<string>, data: any }[] = [];
  for (const file of files) {
    const filePath = path.join(TEST_REPORTS_DIR, file);
    const text = fs.readFileSync(filePath, 'utf8');
    try {
      const data = await extractDonkiDataWithLLM(text); // Wait for each response
      const keys = collectKeyPaths(data);
      const rootKeys = getRootKeys(data);
      results.push({ file, keys, rootKeys, data });
      console.log(`Processed ${file}: ${keys.size} keys`);
      // Save JSON output
      const jsonFileName = file.replace(/\.(md|txt)$/i, '.json');
      const jsonFilePath = path.join(JSON_OUTPUT_DIR, jsonFileName);
      fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Saved JSON to ${jsonFilePath}`);
      // Wait 15 seconds before next request
      await new Promise(res => setTimeout(res, 15000));
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
      console.error('Aborting further processing.');
      process.exit(1);
    }
  }
  compareResults(results);
}

function compareResults(results: { file: string, keys: Set<string>, rootKeys: Set<string>, data: any }[]) {
  // Union of all root keys
  const allRootKeys = new Set<string>();
  for (const r of results) for (const k of r.rootKeys) allRootKeys.add(k);
  // Compare each file's root keys to the union
  for (const { file, rootKeys, keys } of results) {
    const missingRoot = [...allRootKeys].filter(k => !rootKeys.has(k));
    const extraRoot = [...rootKeys].filter(k => !allRootKeys.has(k));
    if (missingRoot.length || extraRoot.length) {
      printReadableReport(file, missingRoot, extraRoot, 'root');
      // If a root key is missing, do not go deeper
      continue;
    }
    // If all root keys are present, do deep comparison
    const allKeys = new Set<string>();
    for (const r of results) for (const k of r.keys) allKeys.add(k);
    const missing = [...allKeys].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !allKeys.has(k));
    printReadableReport(file, missing, extra, 'deep');
  }
}

async function runJsonCompareOnly() {
  if (!fs.existsSync(JSON_OUTPUT_DIR)) {
    console.error('JSON output directory does not exist.');
    process.exit(1);
  }
  const files = fs.readdirSync(JSON_OUTPUT_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No JSON files found in /json.');
    process.exit(1);
  }
  const results: { file: string, keys: Set<string>, rootKeys: Set<string>, data: any }[] = [];
  for (const file of files) {
    const filePath = path.join(JSON_OUTPUT_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const keys = collectKeyPaths(data);
      const rootKeys = getRootKeys(data);
      results.push({ file, keys, rootKeys, data });
    } catch (e) {
      console.error(`Error reading/parsing ${file}:`, e);
      process.exit(1);
    }
  }
  compareResults(results);
}

async function main() {
  const skipLLM = process.env.SKIP_LLM === '1' || process.argv.includes('--skip-llm');
  if (skipLLM) {
    console.log('Running in JSON compare-only mode (SKIP_LLM enabled).');
    await runJsonCompareOnly();
  } else {
    console.log('Running in LLM extraction + compare mode.');
    await runLLMExtractionAndCompare();
  }
}

main(); 