import fs from "node:fs";
import path from "node:path";

const sourceDir = path.resolve(process.cwd(), "../assets");
const targetDir = path.resolve(process.cwd(), "./public/assets");

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
      continue;
    }
    fs.copyFileSync(srcPath, destPath);
  }
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
copyDirectory(sourceDir, targetDir);
