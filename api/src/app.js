
// Archivo: src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();

// middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// servir archivos estáticos (fotos/videos)
const uploadsDir = process.env.UPLOADS_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, "..", uploadsDir)));

// prefijo de la API
app.use("/api", routes);

// manejador de errores al final
app.use(errorHandler);

module.exports = app;
