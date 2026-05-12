import g from './src/_data/github.js';
import gc from './src/_data/github-card.js';
async function run() {
  const dataG = await g();
  console.log("github.js repos count:", dataG.repos.length);
  const dataGc = await gc();
  console.log("github-card.js repoCount:", dataGc.repoCount);
}
run();
