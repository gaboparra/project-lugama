import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import songRoutes from "./routes/song.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API
app.use("/api/songs", songRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Frontend React build
app.use(express.static(path.resolve("frontend/dist")));
app.use((req, res) => {
  res.sendFile(path.resolve("frontend/dist/index.html"));
});

app.use(errorHandler);

export default app;
