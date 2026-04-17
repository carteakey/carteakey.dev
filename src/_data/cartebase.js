import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "cartebase");

export default function cartebase() {
  const out = {};
  let files = [];
  try {
    files = readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  } catch {
    return out;
  }
  for (const file of files) {
    const key = path.basename(file, ".json");
    try {
      out[key] = JSON.parse(readFileSync(path.join(dataDir, file), "utf-8"));
    } catch (err) {
      console.warn(`cartebase: failed to parse ${file}:`, err.message);
    }
  }
  return out;
}
