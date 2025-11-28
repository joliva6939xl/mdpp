const express = require("express");
const router = express.Router();

const {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
  cerrarParte,
} = require("../controllers/partes.controller");

const { upload } = require("../middlewares/upload.middleware");
const { verificarToken } = require("../middlewares/auth.middleware");

// Crear parte (con evidencia multimedia)
router.post("/", verificarToken, upload.array("evidencia", 10), crearParte);

// Listar partes (con paginación, más nuevos primero)
router.get("/", verificarToken, listarPartes);

// Ver detalle de un parte
router.get("/:id", verificarToken, obtenerParte);

// Cerrar parte (marca hora_fin = ahora)
router.put("/cerrar/:id", verificarToken, cerrarParte);

// Actualizar parte (texto, horas, etc.)
router.put("/:id", verificarToken, actualizarParte);

module.exports = router;
