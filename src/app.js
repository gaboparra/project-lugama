import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import songRoutes from "./routes/song.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error de conexión:", err));

// Rutas
app.use("/api/songs", songRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
