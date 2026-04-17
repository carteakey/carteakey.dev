import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

const api_endpoint = "https://api.github.com/users/carteakey/repos?sort=updated&direction=desc";

export default async function () {
  const repos = new AssetCache("repos");
  if (repos.isCacheValid("1d")) {
    return repos.getCachedValue();
  }

  try {
    const repos_data = await fetch(api_endpoint);
    if (!repos_data.ok) {
      throw new Error(`GitHub API returned ${repos_data.status}`);
    }

    const repos_json = await repos_data.json();
    if (!Array.isArray(repos_json)) {
      throw new Error("GitHub API payload was not an array");
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

    await repos.save(repos_final, "json");
    return repos_final;
  } catch (e) {
    console.warn("GitHub data fetch failed, falling back to cache when available.");
    try {
      return await repos.getCachedValue();
    } catch {
      return {
        repos: [],
      };
    }
  }
}
