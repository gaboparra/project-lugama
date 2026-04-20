import express from "express";
import cors from "cors";
import songRoutes from "./routes/song.routes.js";
import authRoutes from "./routes/auth.routes.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/songs", songRoutes);
app.use("/api/auth", authRoutes);

export default app;
