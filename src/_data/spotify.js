
const {
    SPOTIFY_CLIENT_ID: client_id,
    SPOTIFY_CLIENT_SECRET: client_secret,
    SPOTIFY_REFRESH_TOKEN: refresh_token,
  } = process.env;  

const api_endpoint = 'https://api.spotify.com/v1/me/player/currently-playing';
const auth_endpoint = 'https://accounts.spotify.com/api/token';

const { AssetCache } = require("@11ty/eleventy-fetch");

module.exports = async function() {
    let accessToken = '';
    
    let querystring = require('querystring');

    //Cache access token
    let accessTokenCache =  new AssetCache("token");
    let nowPlayingCache =  new AssetCache("now-playing");

    if(accessTokenCache.isCacheValid("1h")) {
        // return cached data.
        console.log("using access token cache")
        accessToken = await accessTokenCache.getCachedValue(); // a promise
        console.log(accessToken);
    }
    else
    {
        fetch(auth_endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            body:  querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token,
              }),
          })
            .then(response => response.json())
            .then(data => {
                console.log(data)
                accessToken = data.access_token;
                accessTokenCache.save(accessToken, "string");
        })
    }

    if(nowPlayingCache.isCacheValid("1m")) {
        // return cached data.
        console.log("using now playing cache")
        return nowPlayingCache.getCachedValue();
    }
    else {
        console.log('here')
        response = await fetch(api_endpoint, {
            headers: {
              'Authorization': 'Bearer ' + accessToken
            }
          })
        
        console.log(response.status )
        if (response.status == 204 || response.status > 400) {
            console.log('API Error. No Song Playing')
            nowPlaying = { 'nowPlaying': {isPlaying: false }};
            //return old song
            return nowPlayingCache.getCachedValue();
        }   

        const song = await response.json();
        console.log(song);
        const isPlaying = song.is_playing;
        const title = song.item.name;
        const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
        const album = song.item.album.name;
        const albumImageUrl = song.item.album.images[0].url;
        const songUrl = song.item.external_urls.spotify;

        nowPlaying = {'nowPlaying':{
            album,
            albumImageUrl,
            artist,
            isPlaying,
            songUrl,
            title}
        };
        console.log(nowPlaying);
        nowPlayingCache.save(nowPlaying,'json')
        return nowPlaying;
    }

}