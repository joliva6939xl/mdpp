// api/src/routes/partes.routes.js
const express = require("express");
const router = express.Router();
const {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
  cerrarParte,
  obtenerEstadisticasCallCenter,
  obtenerMetricasZonales,
  descargarReporteConteo // <--- ✅ 1. IMPORTAMOS LA NUEVA FUNCIÓN AQUÍ
} = require("../controllers/partes.controller");

const { upload } = require("../middlewares/upload.middleware");
const { verificarToken } = require("../middlewares/auth.middleware");

// ==========================================
// RUTAS
// ==========================================

// 1. Crear parte (con evidencia multimedia)
router.post("/", verificarToken, upload.array("evidencia", 10), crearParte);

// -------------------------------------------------------------------
// 🔥 ESTAS RUTAS ESPECÍFICAS DEBEN IR PRIMERO (Antes de /:id)
// -------------------------------------------------------------------

// Estadísticas antiguas/generales del Call Center
router.get("/callcenter/stats", verificarToken, obtenerEstadisticasCallCenter);

// ✅ 2. NUEVA RUTA: MÉTRICAS POR ZONA (Norte, Centro, Sur)
router.get("/metricas/zonales", verificarToken, obtenerMetricasZonales);

// -------------------------------------------------------------------

// 3. Listar partes (con paginación, más nuevos primero)
router.get("/", verificarToken, listarPartes);

// 4. Ver detalle de un parte (ID dinámico)
// ⚠️ IMPORTANTE: Esta ruta captura cualquier cosa (ej: /123, /metricas),
// por eso las rutas específicas como "/metricas/zonales" deben ir ARRIBA de esta.
router.get("/:id", verificarToken, obtenerParte);

// 5. Cerrar parte (marca hora_fin = ahora)
router.put("/cerrar/:id", verificarToken, cerrarParte);
//DESCARGAR EL CONTEO EN WORD
router.get("/reporte/word", verificarToken, descargarReporteConteo);

// 6. Actualizar parte (texto, horas, etc.)
router.put("/:id", verificarToken, actualizarParte);

module.exports = router;