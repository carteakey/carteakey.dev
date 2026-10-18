import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const IS_PRODUCTION_BUILD =
  process.env.ELEVENTY_ENV === "production" ||
  process.env.CONTEXT === "production" ||
  process.env.NODE_ENV === "production";

const SHOW_LOCAL_PREVIEW =
  process.env.SHOW_HIDDEN === "true" || !IS_PRODUCTION_BUILD;

export default function () {
  if (!SHOW_LOCAL_PREVIEW) return {};
  const p = path.resolve("utils/post-snapshots.json");
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}
