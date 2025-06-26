import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

const api_endpoint = "https://api.github.com/users/carteakey/repos?sort=updated&direction=desc";

export default async function () {
  let repos = new AssetCache("repos");
  if (repos.isCacheValid("1d")) {
    // return cached data.
    return repos.getCachedValue(); // a promise
  }
  try {
    const repos_data = await fetch(api_endpoint);
    const repos_json = await repos_data.json();
    const repos_list = repos_json.map((repo) => {
      return {
        repo_name: repo.name,
        repo_url: repo.html_url,
        repo_description: repo.description,
        repo_language: repo.language,
        repo_stars: repo.stargazers_count,
        repo_forks: repo.forks,
        repo_updated: repo.updated_at,
        repo_created: repo.created_at,
        repo_size: repo.size,
      };
    });

    const repos_final = {
      repos: repos_list,
    };

    return repos_final;
  } catch (e) {
    console.log(e);
    return {
      repos: [],
    };
  }
}
