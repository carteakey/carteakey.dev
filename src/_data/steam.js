import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";
import { recordStatusEvent } from "../_utils/statusLog.js";

const {
    STEAM_API_KEY: apiKey,
    STEAM_USER_ID: userId,
} = process.env;

const api_endpoint = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/";

export default async function() {
    let gameCache = new AssetCache("steam_games");

    if (gameCache.isCacheValid("15m")) {
        try {
            return await gameCache.getCachedValue();
        } catch (e) {}
    }

    if (!apiKey || !userId) {
        console.warn("Steam API key or user ID not configured, trying cache fallback");
        await recordStatusEvent({
            level: "warn",
            source: "data:steam",
            message: "Steam API key or user ID not configured",
            fallback: "cache"
        });
        try {
            return await gameCache.getCachedValue();
        } catch (e) {
            return [];
        }
    }

    try {
        const response = await fetch(`${api_endpoint}?key=${apiKey}&steamid=${userId}&format=json&count=10`);

        if (!response.ok) {
            const message = `Steam API returned ${response.status}: ${await response.text()}`;
            console.error("Failed to fetch Steam games:", message);
            await recordStatusEvent({
                level: "error",
                source: "data:steam",
                message,
                fallback: "cache"
            });
            try {
                return await gameCache.getCachedValue();
            } catch (e) {
                return [];
            }
        }

        const data = await response.json();
        const games = data.response?.games || [];

        const toHours = minutes => {
            if (!minutes || minutes <= 0) {
                return 0;
            }

            const hours = minutes / 60;
            return hours >= 10 ? Math.round(hours) : Number(hours.toFixed(1));
        };

        const filteredGames = games.map(game => ({
            name: game.name,
            appid: game.appid,
            playtime_2weeks: toHours(game.playtime_2weeks),
            playtime_forever: toHours(game.playtime_forever),
            url: `https://store.steampowered.com/app/${game.appid}`,
            library_hero: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_hero.jpg`,
        }));

        await gameCache.save(filteredGames, "json");
        return filteredGames;
    } catch (error) {
        console.error("Error fetching Steam games:", error);
        await recordStatusEvent({
            level: "error",
            source: "data:steam",
            message: error,
            fallback: "cache"
        });
        try {
            return await gameCache.getCachedValue();
        } catch (cacheError) {
            return [];
        }
    }
}
