// mdpp/api/src/routes/callcenter.routes.js
const express = require("express");
const router = express.Router();

const { obtenerConteo } = require("../controllers/callcenter.controller");

// ✅ Endpoint que tu frontend está llamando:
router.get("/conteo", obtenerConteo);

module.exports = router;
