const express = require("express");
const router = express.Router();
const {
  obtenerConteoZonas,
  obtenerConteoIncidencias,
} = require("../controllers/callcenter.controller");

router.get("/conteo", obtenerConteoZonas);
// ✅ Nueva ruta para el desglose total de incidencias
router.get("/conteo-incidencias", obtenerConteoIncidencias);

module.exports = router;
