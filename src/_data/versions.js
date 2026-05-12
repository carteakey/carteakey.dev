import { readFile } from 'node:fs/promises';

export default async function () {
  const raw = await readFile(new URL('../../versions.json', import.meta.url), 'utf8');
  return JSON.parse(raw);
}
