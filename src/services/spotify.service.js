import axios from "axios";

let cachedToken = null;
let tokenExpiresAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSpotifyToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000 - 60000; // margen de 1 min
  return cachedToken;
};

export const searchSpotifyTrack = async (title, artist, retries = 3) => {
  try {
    const token = await getSpotifyToken();
    const query = `track:${title} artist:${artist}`;

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: "track", limit: 1 },
    });

    const track = response.data.tracks.items[0];
    if (!track) return null;

    return {
      spotifyId: track.id,
      albumName: track.album.name,
      releaseDate: track.album.release_date,
      durationMs: track.duration_ms,
      popularity: track.popularity,
      spotifyUrl: track.external_urls.spotify,
      albumCover: track.album.images[1]?.url || track.album.images[0]?.url,
    };
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      const retryAfter = parseInt(
        error.response.headers["retry-after"] || "60",
      );
      console.log(
        `Spotify 429 — esperando ${retryAfter}s antes de reintentar...`,
      );
      await sleep(retryAfter * 1000);
      return searchSpotifyTrack(title, artist, retries - 1);
    }
    console.error("Spotify search error:", error.message);
    return null;
  }
};
