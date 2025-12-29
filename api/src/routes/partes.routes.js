// api/src/routes/partes.routes.js
const express = require("express");
const router = express.Router();

const {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
  cerrarParte,
  obtenerEstadisticasCallCenter, // <--- Importamos la nueva función
} = require("../controllers/partes.controller");

const { upload } = require("../middlewares/upload.middleware");
const { verificarToken } = require("../middlewares/auth.middleware");

// ==========================================
// RUTAS
// ==========================================

// 1. Crear parte (con evidencia multimedia)
router.post("/", verificarToken, upload.array("evidencia", 10), crearParte);

// -------------------------------------------------------------------
// 🔥 ESTA RUTA DEBE IR PRIMERO (Antes de /:id)
// -------------------------------------------------------------------
router.get("/callcenter/stats", verificarToken, obtenerEstadisticasCallCenter);

// 2. Listar partes (con paginación, más nuevos primero)
router.get("/", verificarToken, listarPartes);

// 3. Ver detalle de un parte (ID dinámico)
router.get("/:id", verificarToken, obtenerParte);

// 4. Cerrar parte (marca hora_fin = ahora)
router.put("/cerrar/:id", verificarToken, cerrarParte);

// 5. Actualizar parte (texto, horas, etc.)
router.put("/:id", verificarToken, actualizarParte);

module.exports = router;