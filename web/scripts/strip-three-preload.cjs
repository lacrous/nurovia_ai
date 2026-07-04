// Post-build: strip Three.js / react-three modulepreload tags from index.html
// These are only used on the landing page, no need to preload them for everyone.
const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "dist", "index.html");
if (!fs.existsSync(indexPath)) {
  console.log("strip-three-preload: dist/index.html not found, skipping");
  process.exit(0);
}
let html = fs.readFileSync(indexPath, "utf8");
const before = html.length;
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*three[^>]*>/g, "");
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*react-three[^>]*>/g, "");
fs.writeFileSync(indexPath, html);
console.log(`strip-three-preload: removed ${(before - html.length) / 100}kb of preload tags`);