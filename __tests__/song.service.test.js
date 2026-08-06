import { jest } from "@jest/globals";
import prisma from "../src/config/prisma.js";
import axios from "axios";
import {
  isAlternativeVersion,
  validateAnswer,
  createSong,
  getAllSongs,
  updateSong,
  deleteSong,
  getRandomSong,
  searchSongsInDb,
  searchExternal,
  getGenres,
  getArtists,
  seedSongs,
} from "../src/services/song.service.js";

jest.mock("axios");

jest.mock("../src/config/prisma.js", () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
    },
  },
}));

import Song from "../src/models/Song.js";

jest.mock("../src/models/Song.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("validateAnswer", () => {
  it("respuesta correcta en el primer intento suma puntos y estrella", async () => {
    Song.findById.mockResolvedValue({ _id: "1", title: "Bohemian Rhapsody" });
    prisma.user.update.mockResolvedValue({ points: 6, stars: 1 });

    const result = await validateAnswer({
      songId: "1",
      answer: "bohemian rhapsody",
      attempt: 1,
      userId: 1,
    });

    expect(result.correct).toBe(true);
    expect(result.pointsEarned).toBe(6);
    expect(result.starEarned).toBe(true);
  });

  it("respuesta correcta en intento 3 no suma estrella y da menos puntos", async () => {
    Song.findById.mockResolvedValue({ _id: "1", title: "Bohemian Rhapsody" });
    prisma.user.update.mockResolvedValue({ points: 4, stars: 0 });

    const result = await validateAnswer({
      songId: "1",
      answer: "bohemian rhapsody",
      attempt: 3,
      userId: 1,
    });

    expect(result.correct).toBe(true);
    expect(result.pointsEarned).toBe(4);
    expect(result.starEarned).toBe(false);
  });

  it("respuesta incorrecta antes de agotar intentos", async () => {
    Song.findById.mockResolvedValue({ _id: "1", title: "Bohemian Rhapsody" });

    const result = await validateAnswer({
      songId: "1",
      answer: "cancion equivocada",
      attempt: 2,
      userId: 1,
    });

    expect(result.correct).toBe(false);
    expect(result.message).toBe("Wrong answer");
  });

  it("agota los intentos y devuelve mensaje correspondiente", async () => {
    Song.findById.mockResolvedValue({ _id: "1", title: "Bohemian Rhapsody" });

    const result = await validateAnswer({
      songId: "1",
      answer: "cancion equivocada",
      attempt: 6,
      userId: 1,
    });

    expect(result.correct).toBe(false);
    expect(result.message).toBe("Attempts exhausted");
  });

  it("lanza error si la canción no existe", async () => {
    Song.findById.mockResolvedValue(null);

    await expect(
      validateAnswer({
        songId: "999",
        answer: "cualquiera",
        attempt: 1,
        userId: 1,
      }),
    ).rejects.toThrow("Song not found");
  });
});

describe("isAlternativeVersion", () => {
  it("detecta una versión en vivo", () => {
    expect(isAlternativeVersion("Bohemian Rhapsody (Live)")).toBe(true);
  });

  it("no marca un título normal como alternativo", () => {
    expect(isAlternativeVersion("Bohemian Rhapsody")).toBe(false);
  });

  it("detecta la keyword sin importar mayúsculas", () => {
    expect(isAlternativeVersion("Bohemian Rhapsody (LIVE)")).toBe(true);
  });

  it("falso positivo: título original que contiene la keyword como parte del nombre", () => {
    expect(isAlternativeVersion("Live and Let Die")).toBe(true); // falso positivo
  });
});

describe("CRUD básico", () => {
  it("createSong crea una canción", async () => {
    Song.create.mockResolvedValue({ _id: "1", title: "Nueva Canción" });

    const result = await createSong({ title: "Nueva Canción" });

    expect(Song.create).toHaveBeenCalledWith({ title: "Nueva Canción" });
    expect(result).toEqual({ _id: "1", title: "Nueva Canción" });
  });

  it("getAllSongs devuelve todas las canciones", async () => {
    Song.find.mockResolvedValue([{ title: "A" }, { title: "B" }]);

    const result = await getAllSongs();

    expect(result).toHaveLength(2);
  });

  it("updateSong lanza error si la canción no existe", async () => {
    Song.findByIdAndUpdate.mockResolvedValue(null);

    await expect(updateSong("999", { title: "X" })).rejects.toThrow(
      "Song not found",
    );
  });

  it("updateSong actualiza si existe", async () => {
    Song.findByIdAndUpdate.mockResolvedValue({
      _id: "1",
      title: "Actualizada",
    });

    const result = await updateSong("1", { title: "Actualizada" });

    expect(result.title).toBe("Actualizada");
  });

  it("deleteSong lanza error si la canción no existe", async () => {
    Song.findByIdAndDelete.mockResolvedValue(null);

    await expect(deleteSong("999")).rejects.toThrow("Song not found");
  });

  it("deleteSong elimina si existe", async () => {
    Song.findByIdAndDelete.mockResolvedValue({ _id: "1" });

    const result = await deleteSong("1");

    expect(result._id).toBe("1");
  });
});

describe("getRandomSong", () => {
  it("lanza error si no hay canciones para el filtro", async () => {
    Song.countDocuments.mockResolvedValue(0);

    await expect(getRandomSong("rock", null, null)).rejects.toThrow(
      "No songs found for this filter combination",
    );
  });

  it("devuelve una canción aleatoria cuando hay resultados", async () => {
    Song.countDocuments.mockResolvedValue(5);
    Song.findOne.mockReturnValue({
      skip: jest.fn().mockResolvedValue({
        title: "Bohemian Rhapsody",
        artist: "Queen",
        previewUrl: "old-url",
      }),
    });
    axios.get.mockResolvedValue({ data: { data: [] } }); // Deezer refresh sin resultados

    const result = await getRandomSong("rock", null, null);

    expect(result.title).toBe("Bohemian Rhapsody");
  });
});

describe("searchSongsInDb", () => {
  it("devuelve array vacío si no hay query", async () => {
    const result = await searchSongsInDb("");
    expect(result).toEqual([]);
  });

  it("devuelve resultados del aggregate", async () => {
    Song.aggregate.mockResolvedValue([{ title: "Bohemian Rhapsody" }]);

    const result = await searchSongsInDb("bohemian");

    expect(result).toHaveLength(1);
  });
});

describe("searchExternal", () => {
  it("filtra canciones sin preview válido de Deezer", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            title: "Con preview",
            artist: { name: "Artista" },
            preview: "https://cdns-preview.deezer.com/x.mp3",
            album: { cover_medium: "url" },
          },
          {
            title: "Sin preview válido",
            artist: { name: "Artista" },
            preview: null,
            album: { cover_medium: "url" },
          },
        ],
      },
    });

    const result = await searchExternal("queen");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Con preview");
  });
});

describe("getGenres y getArtists", () => {
  it("getGenres devuelve géneros distintos", async () => {
    Song.distinct.mockResolvedValue(["rock", "pop"]);

    const result = await getGenres();

    expect(result).toEqual(["rock", "pop"]);
  });

  it("getArtists devuelve artistas distintos", async () => {
    Song.distinct.mockResolvedValue(["Queen", "ABBA"]);

    const result = await getArtists();

    expect(result).toEqual(["Queen", "ABBA"]);
  });
});

describe("seedSongs", () => {
  it("agrega canciones nuevas correctamente", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("deezer")) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                title: "Bohemian Rhapsody",
                artist: { name: "Queen" },
                preview: "preview.mp3",
                album: { cover_medium: "cover.jpg" },
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { track: null } }); // Last.fm
    });

    Song.findOne.mockResolvedValue(null); // sin duplicados
    Song.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    }); // para recalculatePopularityByGenre
    Song.create.mockResolvedValue({});
    Song.countDocuments.mockResolvedValue(1);

    const result = await seedSongs({ artists: ["Queen"], genre: "rock" });

    expect(Song.create).toHaveBeenCalled();
    expect(result.new_songs).toBe(1);
  });

  it("filtra versiones alternativas (ej. live)", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("deezer")) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 2,
                title: "Bohemian Rhapsody (Live)",
                artist: { name: "Queen" },
                preview: "preview.mp3",
                album: { cover_medium: "cover.jpg" },
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { track: null } });
    });

    Song.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });
    Song.countDocuments.mockResolvedValue(0);

    const result = await seedSongs({ artists: ["Queen"], genre: "rock" });

    expect(Song.create).not.toHaveBeenCalled();
    expect(result.filtered_alt_versions).toBe(1);
  });

  it("omite canciones sin preview", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("deezer")) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 3,
                title: "Sin Preview",
                artist: { name: "Queen" },
                preview: null,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { track: null } });
    });

    Song.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });
    Song.countDocuments.mockResolvedValue(0);

    const result = await seedSongs({ artists: ["Queen"], genre: "rock" });

    expect(Song.create).not.toHaveBeenCalled();
    expect(result.ignored_no_preview).toBe(1);
  });
});
