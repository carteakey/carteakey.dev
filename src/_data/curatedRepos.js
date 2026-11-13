import { readFileSync } from "fs";
import { load } from "js-yaml";

// Repo names already curated on /projects, so the "Projects on GitHub" table
// can show the rest instead of repeating them.
const data = load(readFileSync("src/_data/projects.yaml", "utf8"));

const isEnabled = (item) =>
  !(item && typeof item === "object" && item.enabled === false);

function repoName(url) {
  if (typeof url !== "string") return null;
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts.at(-1)?.toLowerCase() || null;
  } catch {
    return null;
  }
}

const entries = [
  ...(data.current || []),
  ...(data.coming_soon || []),
  ...(data.projects || []),
  ...(data.past || []).flatMap((phase) => phase.items || []),
].filter(isEnabled);

export default [
  ...new Set(entries.map((entry) => repoName(entry.github)).filter(Boolean)),
];
