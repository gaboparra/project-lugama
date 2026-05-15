import axios from "axios";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

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
      playcount: parseInt(track.playcount) || 0, // raw, sin normalizar
      durationMs: parseInt(track.duration) || null,
      albumName: track.album?.title || null,
    };
  } catch (error) {
    console.error("Last.fm error:", error.message);
    return null;
  }
};
