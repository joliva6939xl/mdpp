const express = require("express");
const router = express.Router();
const { obtenerConteoZonas } = require("../controllers/callcenter.controller");

router.get("/conteo", obtenerConteoZonas);

module.exports = router;
