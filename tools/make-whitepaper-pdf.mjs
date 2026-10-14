// Prints tools/whitepaper.html to public/downloads/ as a PDF using headless Microsoft Edge or Chrome.
// Usage: npm run whitepaper   (set BROWSER=/path/to/chrome to override)

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'tools', 'whitepaper.html');
const OUT = path.join(ROOT, 'public', 'downloads', 'RightPath_Foundational_Reinforcement_White_Paper.pdf');

const candidates = [
  process.env.BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error('No Edge or Chrome found. Set BROWSER=/path/to/browser.');
  process.exit(1);
}

execFileSync(browser, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${OUT}`,
  pathToFileURL(SRC).href,
], { stdio: 'inherit' });

console.log(`Wrote ${path.relative(ROOT, OUT)}`);
