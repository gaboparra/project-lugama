import axios from "axios";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

interface LastfmTrackResponse {
  track?: {
    playcount?: string;
    duration?: string;
    album?: {
      title?: string;
    };
  };
}

export interface LastfmData {
  playcount: number;
  durationMs: number | null;
  albumName: string | null;
}

export const getLastfmData = async (
  title: string,
  artist: string,
): Promise<LastfmData | null> => {
  try {
    const response = await axios.get<LastfmTrackResponse>(
      "https://ws.audioscrobbler.com/2.0/",
      {
        params: {
          method: "track.getInfo",
          api_key: LASTFM_API_KEY,
          artist,
          track: title,
          format: "json",
        },
      },
    );

    const track = response.data.track;
    if (!track) return null;

    return {
      playcount: parseInt(track.playcount || "0") || 0,
      durationMs: parseInt(track.duration || "") || null,
      albumName: track.album?.title || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Last.fm error:", message);
    return null;
  }
};
