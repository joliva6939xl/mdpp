// Archivo: src/routes/partes.routes.js
const express = require("express");
const router = express.Router();

const {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
} = require("../controllers/partes.controller");

// Crear parte
router.post("/", crearParte);

// Listar partes (opcionalmente ?usuario_id=)
router.get("/", listarPartes);

// Detalle de parte
router.get("/:id", obtenerParte);

// 🔹 NUEVO: actualizar parte (PUT /api/partes/:id)
router.put("/:id", actualizarParte);

module.exports = router;
