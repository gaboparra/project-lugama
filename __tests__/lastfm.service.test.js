import { jest } from "@jest/globals";
import axios from "axios";
import { getLastfmData } from "../src/services/lastfm.service.js";

jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getLastfmData", () => {
  it("devuelve datos normalizados cuando la API responde con track", async () => {
    axios.get.mockResolvedValue({
      data: {
        track: {
          playcount: "12345",
          duration: "210000",
          album: { title: "A Night at the Opera" },
        },
      },
    });

    const result = await getLastfmData("Bohemian Rhapsody", "Queen");

    expect(result).toEqual({
      playcount: 12345,
      durationMs: 210000,
      albumName: "A Night at the Opera",
    });
  });

  it("devuelve null si la API no encuentra el track", async () => {
    axios.get.mockResolvedValue({ data: {} });

    const result = await getLastfmData("Cancion Inexistente", "Nadie");

    expect(result).toBeNull();
  });

  it("devuelve null si axios lanza un error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("Network error"));

    const result = await getLastfmData("Cualquier cosa", "Alguien");

    expect(result).toBeNull();
  });
});
