const { Router } = require("express");
const router = Router();
const { generarReporteWord } = require("../controllers/reporteWord.controller");

// Ruta GET que descarga el archivo
// Se llamará como: /api/exportar/word?fecha=2023-10-27&turno=MAÑANA
router.get("/word", generarReporteWord);

module.exports = router;