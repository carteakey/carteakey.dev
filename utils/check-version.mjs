import { readFile } from "node:fs/promises";

// versions.json is the canonical release number: templates use it to cache-bust
// assets. package.json must agree so `npm version` style tooling never drifts.

const [pkgRaw, versionsRaw] = await Promise.all([
  readFile("package.json", "utf8"),
  readFile("versions.json", "utf8"),
]);

const pkg = JSON.parse(pkgRaw);
const versions = JSON.parse(versionsRaw);

if (pkg.version !== versions.version) {
  console.error(
    `Version drift: package.json is ${pkg.version} but versions.json is ${versions.version}.\n` +
      `Bump both together (versions.json drives asset cache-busting).`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Version ${versions.version} is consistent across package.json and versions.json.`,
  );
}
