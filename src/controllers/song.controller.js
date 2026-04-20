import axios from "axios";
import Song from "../models/Song.js";

export const addSong = async (req, res) => {
  try {
    const { title, artist, previewUrl, albumCover, difficulty } = req.body;

    const newSong = new Song({
      title,
      artist,
      previewUrl,
      albumCover,
      difficulty,
    });
    const savedSong = await newSong.save();

    res.status(201).json({
      message: "Cancion guardada correctamente",
      song: savedSong,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar la cancion", details: error.message });
  }
};

export const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener canciones" });
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSong = await Song.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedSong) {
      return res.status(404).json({ error: "No se encontro la cancion" });
    }

    res.json({ message: "Cancion actualizada", song: updatedSong });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar", details: error.message });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSong = await Song.findByIdAndDelete(id);

    if (!deletedSong) {
      return res.status(404).json({ error: "No se encontro la cancion para borrar" });
    }

    res.json({ message: "Cancion eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar", details: error.message });
  }
};

export const getRandomSong = async (req, res) => {
  try {
    // Aggregate de Mongo para traer una muestra aleatoria de 1
    const count = await Song.countDocuments();
    const random = Math.floor(Math.random() * count);
    const song = await Song.findOne().skip(random);

    if (!song) {
      return res.status(404).json({ error: "No hay canciones cargadas" });
    }

    res.json(song);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener canción aleatoria" });
  }
};

export const validateAnswer = async (req, res) => {
  try {
    const { songId, answer } = req.body;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: "Canción no encontrada" });
    }

    const isCorrect = song.title.toLowerCase().trim() === answer.toLowerCase().trim();

    if (isCorrect) {
      return res.json({
        correct: true,
        message: "¡Adivinaste!",
        fullData: song, // Aquí recién revelamos todo
      });
    } else {
      return res.json({
        correct: false,
        message: "Sigue intentando",
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al validar respuesta" });
  }
};

// Buscar canciones en la API de Deezer
export const searchExternalSong = async (req, res) => {
  try {
    const { query } = req.query; // Ejemplo: /search-external?query=skrillex
    if (!query) {
      return res.status(400).json({ error: "Debes enviar un termino de busqueda" });
    }

    const response = await axios.get(`https://api.deezer.com/search?q=${query}`);

    // Mapeamos solo la data que nos sirve para nuestro modelo
    const songs = response.data.data.map((song) => ({
      title: song.title,
      artist: song.artist.name,
      previewUrl: song.preview,
      albumCover: song.album.cover_medium,
    }));

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error al conectar con la API externa" });
  }
};

export const searchSongsInDb = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
      ],
    }).limit(50);

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error en el buscador" });
  }
};

export const seedDatabase = async (req, res) => {
  // Si quieres mas precision, puedes usar 'artist:"Skrillex"'
  // Pero si quieres variedad, dejalos como strings simples.
  const artists = [
    'artist:"Pantera"',
    'artist:"Patricio Rey y sus Redonditos de Ricota"',
    'artist:"Intoxicados"',
    'artist:"The Rolling Stones"',
    'artist:"Guns n Roses"',
    'artist:"Linkin Park"',
  ];

  let addedCount = 0;
  let skippedCount = 0;

  try {
    for (const artistQuery of artists) {
      // Limite de 50 para tener mas margen de eleccion
      const response = await axios.get(
        `https://api.deezer.com/search?q=${artistQuery}&limit=50`,
      );
      const tracks = response.data.data;

      if (!tracks || tracks.length === 0) continue;

      for (const track of tracks) {
        // Verificacion de duplicados por URL de preview
        const exists = await Song.findOne({ previewUrl: track.preview });

        if (!exists) {
          await Song.create({
            title: track.title,
            artist: track.artist.name,
            previewUrl: track.preview,
            albumCover: track.album.cover_medium,
            difficulty: 1,
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    res.json({
      status: "Proceso completado",
      nuevas_canciones: addedCount,
      ignoradas_por_duplicadas: skippedCount,
      total_en_db: await Song.countDocuments(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Error en el seeding masivo",
      details: error.message,
    });
  }
};
