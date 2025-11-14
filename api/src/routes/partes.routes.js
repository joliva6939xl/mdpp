// Archivo: src/routes/partes.routes.js
const express = require("express");
const router = express.Router();
const {
  crearParte,
  listarPartes,
  obtenerParte,
} = require("../controllers/partes.controller");
const { parteFilesUpload } = require("../middlewares/upload.middleware");
const { fakeAuth } = require("../middlewares/auth.middleware");

// todas las rutas de partes requieren usuario (fakeAuth por ahora)
router.use(fakeAuth);

// crear parte (texto + fotos/videos opcionales)
router.post(
  "/",
  parteFilesUpload.array("archivos", 10), // hasta 10 archivos
  crearParte
);

// listar partes
router.get("/", listarPartes);

// obtener detalle de parte
router.get("/:id", obtenerParte);

module.exports = router;
