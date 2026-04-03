import { AssetCache } from "@11ty/eleventy-fetch";
import querystring from "querystring";
import fetch from "node-fetch";

const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const api_endpoint = "https://api.spotify.com/v1/me/player/currently-playing";
const auth_endpoint = "https://accounts.spotify.com/api/token";

async function fetchAccessToken() {
  let accessToken = "";

  //Cache access token
  let accessTokenCache = new AssetCache("token");

  if (accessTokenCache.isCacheValid("1h")) {
    accessToken = await accessTokenCache.getCachedValue();
  } else {
    let response = await fetch(auth_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: querystring.stringify({
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    if (response.status == 204 || response.status > 400) {
      console.warn("Unable to fetch Spotify access token, using cached token if available");
      accessToken = await accessTokenCache.getCachedValue();
    } else {
      const data = await response.json();
      accessToken = data.access_token;
      await accessTokenCache.save(accessToken, "string");
    }
  }
  return accessToken;
}

export default async function () {
  let nowPlaying = "";
  let accessToken = await fetchAccessToken();
  let nowPlayingCache = new AssetCache("now-playing");

  if (nowPlayingCache.isCacheValid("1m")) {
    nowPlaying = await nowPlayingCache.getCachedValue();
  } else {
    let response = await fetch(api_endpoint, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    if (response.status == 204 || response.status > 400) {
      console.warn("Spotify now-playing unavailable, using cached value if available");
      try {
        nowPlaying = await nowPlayingCache.getCachedValue();
      } catch (e) {
        return {
          nowPlaying: {
            album: "Meteora (Bonus Edition)",
            albumImageUrl:
              "https://i.scdn.co/image/ab67616d0000b27389a8fab8bf8cd2b77da1fd17",
            artist: "Linkin Park",
            isPlaying: true,
            songUrl: "https://open.spotify.com/track/3fjmSxt0PskST13CSdBUFx",
            title: "Somewhere I Belong",
          },
        };
      }
    } else {
      const song = await response.json();
      
      // Handle case when item is null (e.g., podcast episodes)
      if (!song.item) {
        console.warn("Spotify item has no track data, using cached value if available");
        try {
          nowPlaying = await nowPlayingCache.getCachedValue();
        } catch (e) {
          return {
            nowPlaying: {
              album: "Meteora (Bonus Edition)",
              albumImageUrl:
                "https://i.scdn.co/image/ab67616d0000b27389a8fab8bf8cd2b77da1fd17",
              artist: "Linkin Park",
              isPlaying: true,
              songUrl: "https://open.spotify.com/track/3fjmSxt0PskST13CSdBUFx",
              title: "Somewhere I Belong",
            },
          };
        }
      } else {
        const isPlaying = song.is_playing;
        const title = song.item.name;
        const artist = song.item.artists
          .map((_artist) => _artist.name)
          .join(", ");
        const album = song.item.album.name;
        const albumImageUrl = song.item.album.images[0].url;
        const songUrl = song.item.external_urls.spotify;

        nowPlaying = {
          nowPlaying: {
            album,
            albumImageUrl,
            artist,
            isPlaying,
            songUrl,
            title,
          },
        };
        await nowPlayingCache.save(nowPlaying, "json");
      }
    }
  }
  return nowPlaying;
}
