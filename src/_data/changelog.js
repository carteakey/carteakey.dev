import { readFileSync } from "fs";

export default function () {
  let raw = "";
  try {
    raw = readFileSync("docs/CHANGELOG.md", "utf-8");
  } catch (_) {
    return [];
  }

  // Split into version blocks by ## [x.y.z] - date
  const versionRe = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/m;
  const blocks = raw.split(/(?=^## \[\d+\.\d+\.\d+\])/m).filter((b) =>
    versionRe.test(b)
  );

  return blocks.map((block) => {
    const header = versionRe.exec(block);
    const version = header ? header[1] : "?";
    const date = header ? header[2] : null;

    const sections = {};
    const sectionRe = /^### (Added|Changed|Fixed|Removed)\n([\s\S]*?)(?=^### |\z)/gm;
    let match;
    while ((match = sectionRe.exec(block)) !== null) {
      const sectionName = match[1];
      const items = match[2]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2).trim());
      if (items.length > 0) {
        if (!sections[sectionName]) sections[sectionName] = [];
        sections[sectionName].push(...items);
      }
    }

    return { version, date, sections };
  });
}
