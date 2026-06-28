const envGroups = {
  spotify: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"],
  steam: ["STEAM_API_KEY", "STEAM_USER_ID"],
  strava: ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REFRESH_TOKEN"],
  upstash: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  openai: ["OPENAI_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  ollama: ["OLLAMA_API_URL"],
};

function hasAll(names) {
  return names.every((name) => Boolean(process.env[name]));
}

export default function () {
  return {
    checkedAt: new Date(),
    env: Object.fromEntries(
      Object.entries(envGroups).map(([key, names]) => [key, hasAll(names)])
    ),
  };
}
