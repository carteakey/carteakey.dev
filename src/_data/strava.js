import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";
import querystring from "querystring";

const {
    STRAVA_CLIENT_ID: client_id,
    STRAVA_CLIENT_SECRET: client_secret,
    STRAVA_REFRESH_TOKEN: refresh_token,
    MAPBOX_API_KEY: mapboxApiKey,
} = process.env;

const auth_endpoint = "https://www.strava.com/oauth/token";
const api_endpoint = "https://www.strava.com/api/v3/athlete/activities";

async function getAccessToken() {
    let tokenCache = new AssetCache("strava_token");

    if (tokenCache.isCacheValid("1h")) {
        console.log("Using cached Strava token");
        return tokenCache.getCachedValue();
    }

    const response = await fetch(auth_endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: querystring.stringify({
            client_id,
            client_secret,
            refresh_token,
            grant_type: "refresh_token",
        }),
    });

    if (!response.ok) {
        console.error("Failed to fetch Strava access token:", await response.text());
        return null;
    }

    const data = await response.json();
    const accessToken = data.access_token;
    await tokenCache.save(accessToken, "string");
    console.log("Fetched and cached new Strava token");
    return accessToken;
}

export default async function() {
    let activityCache = new AssetCache("strava_activities");

    if (activityCache.isCacheValid("15m")) {
        console.log("Using cached Strava activities");
        return activityCache.getCachedValue();
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
        return [];
    }

    const response = await fetch(`${api_endpoint}?per_page=10`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        console.error("Failed to fetch Strava activities:", await response.text());
        return [];
    }

    const activities = await response.json();
    const filteredActivities = activities.map(a => {
        const polyline = a.map.summary_polyline;
        const mapImageUrl = polyline && mapboxApiKey
            ? `https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/path-5+f44-0.7(${encodeURIComponent(polyline)})/auto/600x400@2x?access_token=${mapboxApiKey}`
            : null;

        return {
            name: a.name,
            type: a.type,
            distance: (a.distance / 1609.34).toFixed(2), // meters to miles
            moving_time: Math.round(a.moving_time / 60), // seconds to minutes
            url: `https://www.strava.com/activities/${a.id}`,
            start_date: new Date(a.start_date_local),
            mapImageUrl,
        };
    });

    await activityCache.save(filteredActivities, "json");
    console.log("Fetched and cached new Strava activities");

    return filteredActivities;
};
