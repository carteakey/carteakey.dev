import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

const {
    STEAM_API_KEY: apiKey,
    STEAM_USER_ID: userId,
} = process.env;

const api_endpoint = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/";

export default async function() {
    let gameCache = new AssetCache("steam_games");

    if (gameCache.isCacheValid("15m")) {
        console.log("Using cached Steam games");
        return gameCache.getCachedValue();
    }

    if (!apiKey || !userId) {
        console.warn("Steam API key or user ID not configured");
        return [];
    }

    try {
        const response = await fetch(`${api_endpoint}?key=${apiKey}&steamid=${userId}&format=json&count=10`);

        if (!response.ok) {
            console.error("Failed to fetch Steam games:", await response.text());
            return [];
        }

        const data = await response.json();
        const games = data.response?.games || [];

        const filteredGames = games.map(game => ({
            name: game.name,
            appid: game.appid,
            playtime_2weeks: Math.round(game.playtime_2weeks / 60), // minutes to hours
            playtime_forever: Math.round(game.playtime_forever / 60), // minutes to hours
            url: `https://store.steampowered.com/app/${game.appid}`,
            library_hero: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_hero.jpg`,
        }));

        await gameCache.save(filteredGames, "json");
        console.log("Fetched and cached new Steam games");

        return filteredGames;
    } catch (error) {
        console.error("Error fetching Steam games:", error);
        return [];
    }
}
