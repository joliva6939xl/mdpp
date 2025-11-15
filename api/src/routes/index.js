// Archivo: src/routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const partesRoutes = require("./partes.routes");

router.use("/auth", authRoutes);
router.use("/partes", partesRoutes);

module.exports = router;
