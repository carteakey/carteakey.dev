import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

const REPOS_API = "https://api.github.com/users/carteakey/repos?sort=updated&direction=desc&per_page=100";
const USER_API = "https://api.github.com/users/carteakey";

export default async function () {
  const cache = new AssetCache("github_card");
  if (cache.isCacheValid("1d")) {
    return cache.getCachedValue();
  }

  const fallback = {
    login: "carteakey",
    name: "Kartikey Chauhan",
    avatarUrl: "https://github.com/carteakey.png",
    bio: null,
    followers: null,
    publicRepos: null,
    totalStars: null,
    totalForks: null,
    repoCount: null,
    topLanguages: [],
    topRepos: [],
  };

  try {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const [userRes, reposRes] = await Promise.all([
      fetch(USER_API, { headers }),
      fetch(REPOS_API, { headers }),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      throw new Error(`GitHub API error: user=${userRes.status} repos=${reposRes.status}`);
    }

    const [user, repos] = await Promise.all([userRes.json(), reposRes.json()]);

    if (!Array.isArray(repos)) throw new Error("Repos payload was not an array");

    // Aggregate stats
    let totalStars = 0;
    let totalForks = 0;
    const langCounts = {};

    for (const repo of repos) {
      if (repo.fork) continue; // skip forks for cleaner stats
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    }

    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const topRepos = repos
      .filter((r) => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3)
      .map((r) => ({
        name: r.name,
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        description: r.description,
        language: r.language,
      }));

    const result = {
      login: user.login,
      name: user.name || "Kartikey Chauhan",
      avatarUrl: user.avatar_url,
      bio: user.bio,
      followers: user.followers,
      publicRepos: user.public_repos,
      totalStars,
      totalForks,
      repoCount: repos.filter((r) => !r.fork).length,
      topLanguages,
      topRepos,
    };

    await cache.save(result, "json");
    return result;
  } catch (e) {
    console.warn("github-card: fetch failed, using fallback.", e.message);
    try {
      return await cache.getCachedValue();
    } catch {
      return fallback;
    }
  }
}
