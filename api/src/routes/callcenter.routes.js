// mdpp/api/src/routes/callcenter.routes.js
const express = require("express");
const router = express.Router();

const {
  obtenerConteoPartesPorZona,
} = require("../controllers/callcenter.controller");

// GET /api/callcenter/conteo
router.get("/conteo", obtenerConteoPartesPorZona);

module.exports = router;
