import gc from './src/_data/github-card.js';
async function run() {
  const dataGc = await gc();
  console.log("github-card.js repoCount:", dataGc.repoCount);
}
run();
