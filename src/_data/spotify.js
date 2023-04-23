const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const api_endpoint = "https://api.spotify.com/v1/me/player/currently-playing";
const auth_endpoint = "https://accounts.spotify.com/api/token";

const { AssetCache } = require("@11ty/eleventy-fetch");

async function fetchAccessToken() {
  let accessToken = "";
  let querystring = require("querystring");
  let fetch = require("node-fetch");

  //Cache access token
  let accessTokenCache = new AssetCache("token");

  if (accessTokenCache.isCacheValid("1h")) {
    // return cached data.
    console.log("using access token cache");
    accessToken = await accessTokenCache.getCachedValue(); // a promise
    console.log(accessToken);
  } else {
    response = await fetch(auth_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: querystring.stringify({
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    console.log(response.status);
    if (response.status == 204 || response.status > 400) {
      console.log("Unable to fetch access token");
      accessToken = await accessTokenCache.getCachedValue(); // a promise
      console.log(accessToken);
    } else {
      console.log("Response:");
      const data = await response.json();
      console.log(data);
      accessToken = data.access_token;
      accessTokenCache.save(accessToken, "string");
    }
  }
  return accessToken;
}

module.exports = async function () {
  let nowPlaying = "";
  let fetch = require("node-fetch");
  let accessToken = await fetchAccessToken();
  let nowPlayingCache = new AssetCache("now-playing");

  if (nowPlayingCache.isCacheValid("1m")) {
    // return cached data.
    console.log("using now playing cache");
    nowPlaying = await nowPlayingCache.getCachedValue();
    console.log(nowPlaying);
  } else {
    response = await fetch(api_endpoint, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    console.log(response.status);
    if (response.status == 204 || response.status > 400) {
      console.log("API Error. No Song Playing");
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
      console.log(song);
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
      console.log(nowPlaying);
      nowPlayingCache.save(nowPlaying, "json");
    }
  }
  return nowPlaying;
};
