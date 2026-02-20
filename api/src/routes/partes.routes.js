const express = require("express");
const router = express.Router();
const partesController = require("../controllers/partes.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

// Importamos el Middleware Híbrido (Para fotos y videos)
const { uploadPartes } = require("../middlewares/upload.middleware");

// Importamos el controlador para descargar el ZIP (Folio)
const { descargarFolioParte } = require("../controllers/descargas.controller");

// ==========================================
// 1. RUTAS PRINCIPALES (CRUD)
// ==========================================

// CREAR PARTE (Con subida de archivos)
router.post(
  "/", 
  verificarToken, 
  uploadPartes.array("evidencia", 10), // Permite hasta 10 fotos/videos
  partesController.crearParte
);

// LISTAR PARTES (Paginación y filtros)
router.get("/", verificarToken, partesController.listarPartes);

// OBTENER UN PARTE (Detalle por ID)
// Nota: En tu controlador se llama 'obtenerParte'
router.get("/:id", verificarToken, partesController.obtenerParte);

// EDITAR PARTE
router.put("/:id", verificarToken, partesController.actualizarParte);

// CERRAR PARTE (Marcar hora fin)
router.put("/cerrar/:id", verificarToken, partesController.cerrarParte);

// ⚠️ NOTA: Tu controlador NO tiene la función 'eliminarParte'.
// He comentado esta línea para que no te de error.
// router.delete("/:id", verificarToken, partesController.eliminarParte);


// ==========================================
// 2. RUTAS DE ESTADÍSTICAS (DASHBOARD)
// ==========================================

// Estadísticas del Call Center
// Antes: getCallCenterStats -> Ahora: obtenerEstadisticasCallCenter
router.get("/callcenter/stats", verificarToken, partesController.obtenerEstadisticasCallCenter);

// Métricas por Zona
// Antes: getMetricasZonales -> Ahora: obtenerMetricasZonales
router.get("/metricas/zonales", verificarToken, partesController.obtenerMetricasZonales);

// Calendario de días con datos
// Antes: getFechasConPartes -> Ahora: obtenerFechasActivas
router.get("/fechas-activas", verificarToken, partesController.obtenerFechasActivas);


// ==========================================
// 3. RUTAS DE REPORTES (DESCARGAS)
// ==========================================

// NUEVA RUTA: Descargar el Expediente ZIP (PDF + Fotos + Mapa)
router.get("/:id/descargar-folio", verificarToken, descargarFolioParte);

// Descarga en WORD
// Antes: descargarReporteWord -> Ahora: descargarReporteConteo (Según tu código)
router.get("/reporte/word", verificarToken, partesController.descargarReporteConteo);

// Descarga en EXCEL
router.get("/reporte/excel", verificarToken, partesController.descargarReporteExcel);

module.exports = router;