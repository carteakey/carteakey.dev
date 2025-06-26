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
    
    // Check if the response is an error or not an array
    if (!Array.isArray(repos_json)) {
      console.error("GitHub API did not return an array. Response:", repos_json);
      await repos.save({
        repos: [],
      }, "1d");
      return {
        repos: [],
      };
    }
    
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

    await repos.save(repos_final, "1d");
    return repos_final;
  } catch (e) {
    console.error("Error fetching GitHub repos:", e);
    await repos.save({
      repos: [],
    }, "1d");
    return {
      repos: [],
    };
  }
}
