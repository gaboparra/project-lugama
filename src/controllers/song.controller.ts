import { Request, Response } from "express";
import * as songService from "../services/song.service.js";
import { AuthRequest } from "../types/express.js";
import { getErrorInfo } from "../utils/errors.js";

export const addSong = async (req: Request, res: Response) => {
  try {
    const song = await songService.createSong(req.body);
    res.status(201).json({ message: "Song saved successfully", song });
  } catch (error) {
    const { message } = getErrorInfo(error);
    res.status(500).json({ error: "Error saving the song", details: message });
  }
};

export const getAllSongs = async (req: Request, res: Response) => {
  try {
    const songs = await songService.getAllSongs();
    res.json(songs);
  } catch {
    res.status(500).json({ error: "Error fetching songs" });
  }
};

export const updateSong = async (req: Request, res: Response) => {
  try {
    const song = await songService.updateSong(
      req.params.id as string,
      req.body,
    );
    res.json({ message: "Song updated", song });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const deleteSong = async (req: Request, res: Response) => {
  try {
    await songService.deleteSong(req.params.id as string);
    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const getRandomSong = async (req: Request, res: Response) => {
  try {
    const { genre, difficulty, artist } = req.query;
    const song = await songService.getRandomSong(
      genre as string | undefined,
      difficulty ? parseInt(difficulty as string) : undefined,
      artist as string | undefined,
    );
    res.json(song);
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const validateAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const result = await songService.validateAnswer({
      ...req.body,
      userId: req.user!.id,
    });
    res.json(result);
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const searchSongsInDb = async (req: Request, res: Response) => {
  try {
    const songs = await songService.searchSongsInDb(req.query.q as string);
    res.json(songs);
  } catch {
    res.status(500).json({ error: "Search error" });
  }
};

export const searchExternalSong = async (req: Request, res: Response) => {
  try {
    if (!req.query.query) {
      res.status(400).json({ error: "Search term required" });
      return;
    }
    const songs = await songService.searchExternal(req.query.query as string);
    res.json(songs);
  } catch {
    res.status(500).json({ error: "Error connecting to external API" });
  }
};

export const seedDatabase = async (req: Request, res: Response) => {
  try {
    const { artists, genre } = req.body;
    if (!Array.isArray(artists) || artists.length === 0) {
      res.status(400).json({ error: "You must send an array of artists and a genre" });
      return;
    }
    const result = await songService.seedSongs({ artists, genre });
    res.json({ status: "Process completed", ...result });
  } catch (error) {
    const { message } = getErrorInfo(error);
    res.status(500).json({ error: "Error in mass seeding", details: message });
  }
};

export const getExistingGenres = async (req: Request, res: Response) => {
  try {
    const genres = await songService.getGenres();
    res.json(genres);
  } catch {
    res.status(500).json({ error: "Error fetching genres" });
  }
};

export const getExistingArtists = async (req: Request, res: Response) => {
  try {
    const artists = await songService.getArtists();
    res.json(artists);
  } catch {
    res.status(500).json({ error: "Error fetching artists" });
  }
};
