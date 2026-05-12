import g from './src/_data/github.js';
import gc from './src/_data/github-card.js';
async function run() {
  const dataG = await g();
  console.log("github.js repos:");
  dataG.repos.forEach(r => console.log(r.repo_name));
  
  const dataGc = await gc();
  console.log("\ngithub-card.js topRepos:");
  dataGc.topRepos.forEach(r => console.log(r.name));
}
run();
