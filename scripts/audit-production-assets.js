const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root)
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(root, file));
const cssFiles = fs.readdirSync(path.join(root, 'css'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => path.join(root, 'css', file));

const assetPattern = /assets\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|svg)/gi;
const references = new Set();

for (const file of [...htmlFiles, ...cssFiles]) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(assetPattern)) references.add(match[0]);
}

const missing = [];
const oversized = [];

for (const reference of references) {
  const file = path.join(root, ...reference.split('/'));
  if (!fs.existsSync(file)) {
    missing.push(reference);
    continue;
  }

  const bytes = fs.statSync(file).size;
  if (bytes > 200 * 1024) oversized.push({ reference, bytes });
}

console.log(`Referenced assets: ${references.size}`);
console.log(`Missing assets: ${missing.length}`);
missing.forEach((reference) => console.log(`  ${reference}`));
console.log(`Referenced assets over 200 KB: ${oversized.length}`);
oversized.forEach(({ reference, bytes }) => {
  console.log(`  ${reference} (${(bytes / 1024).toFixed(1)} KB)`);
});

if (missing.length || oversized.length) process.exitCode = 1;
