// Archivo: src/routes/index.js
const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, message: "API MDPP funcionando" });
});

router.use("/auth", require("./auth.routes"));
router.use("/partes", require("./partes.routes"));

module.exports = router;
