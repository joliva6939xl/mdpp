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
  descargarReporteConteo,
  descargarReporteExcel,
  obtenerFechasActivas // <--- ✅ 1. IMPORTAMOS LA NUEVA FUNCIÓN
} = require("../controllers/partes.controller");

const { upload } = require("../middlewares/upload.middleware");
const { verificarToken } = require("../middlewares/auth.middleware");

// ==========================================
// RUTAS
// ==========================================

// 1. Crear parte (con evidencia multimedia)
router.post("/", verificarToken, upload.array("evidencia", 10), crearParte);

// -------------------------------------------------------------------
// 🔥 ESTAS RUTAS ESPECÍFICAS DEBEN IR PRIMERO (Siempre antes de /:id y de /)
// -------------------------------------------------------------------

// Estadísticas antiguas/generales del Call Center
router.get("/callcenter/stats", verificarToken, obtenerEstadisticasCallCenter);

// Métricas por zona
router.get("/metricas/zonales", verificarToken, obtenerMetricasZonales);

// ✅ 2. NUEVA RUTA: CALENDARIO (Días con datos)
// (La ponemos aquí arriba para que no choque con nada)
router.get("/fechas-activas", verificarToken, obtenerFechasActivas);

// ✅ 3. RUTAS DE REPORTES (Las moví aquí arriba por seguridad)
router.get("/reporte/word", verificarToken, descargarReporteConteo);
router.get("/reporte/excel", verificarToken, descargarReporteExcel);

// -------------------------------------------------------------------

// 4. Listar partes (con paginación, más nuevos primero)
router.get("/", verificarToken, listarPartes);

// 5. Ver detalle de un parte (ID dinámico)
// ⚠️ IMPORTANTE: Esta ruta captura "cualquier cosa". Por eso, todo lo específico
// (como /metricas, /fechas-activas, /reporte) tiene que estar escrito ARRIBA de esta línea.
router.get("/:id", verificarToken, obtenerParte);

// 6. Cerrar parte (marca hora_fin = ahora)
router.put("/cerrar/:id", verificarToken, cerrarParte);

// 7. Actualizar parte (texto, horas, etc.)
router.put("/:id", verificarToken, actualizarParte);

module.exports = router;