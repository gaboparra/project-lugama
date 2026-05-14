import axios from "axios";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const PLAYCOUNT_CAP = 5_000_000; // canciones con más plays quedan en popularity 100

const normalizePlaycount = (playcount) =>
  Math.min(Math.round((parseInt(playcount) / PLAYCOUNT_CAP) * 100), 100);

export const getLastfmData = async (title, artist) => {
  try {
    const response = await axios.get("https://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "track.getInfo",
        api_key: LASTFM_API_KEY,
        artist,
        track: title,
        format: "json",
      },
    });

    const track = response.data.track;
    if (!track) return null;

    return {
      playcount: parseInt(track.playcount) || 0,
      popularity: normalizePlaycount(track.playcount || 0),
      durationMs: parseInt(track.duration) || null,
      albumName: track.album?.title || null,
    };
  } catch (error) {
    console.error("Last.fm error:", error.message);
    return null;
  }
};
