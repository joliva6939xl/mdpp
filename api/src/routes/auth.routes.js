// Archivo: src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { registrarUsuario, loginUsuario } = require("../controllers/auth.controller");
const { userPhotoUpload } = require("../middlewares/upload.middleware");

// crear usuario (con foto opcional)
router.post("/register", userPhotoUpload.single("foto"), registrarUsuario);

// login simple por DNI (para futuro)
router.post("/login", loginUsuario);

module.exports = router;
