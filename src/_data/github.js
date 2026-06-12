import fetch from "node-fetch";
import { fetchWithFallback } from "../_utils/fetchWithFallback.js";

const api_endpoint = "https://api.github.com/users/carteakey/repos?sort=updated&direction=desc";

export default async function () {
  return fetchWithFallback({
    cacheKey: "repos",
    cacheDuration: "1d",
    timeoutMs: 5000,
    fallbackData: { repos: [] },
    fetchFn: async () => {
      const repos_data = await fetch(api_endpoint);
      if (!repos_data.ok) {
        throw new Error(`GitHub API returned ${repos_data.status}`);
      }

      const repos_json = await repos_data.json();
      if (!Array.isArray(repos_json)) {
        throw new Error("GitHub API payload was not an array");
      }

      const repos_list = repos_json.filter((r) => !r.private).map((repo) => {
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

      return {
        repos: repos_list,
      };
    }
  });
}

