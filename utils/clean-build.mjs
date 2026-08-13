import { mkdir, rm } from "node:fs/promises";

const outputDirectory = new URL("../_site/", import.meta.url);

await rm(outputDirectory, {
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 100,
});
await mkdir(new URL("img/", outputDirectory), { recursive: true });
