// api/src/routes/usuarios.routes.js

const express = require("express");
const router = express.Router();

const {
  obtenerUsuarioPorId,
  actualizarFotoPerfil,
} = require("../controllers/usuarios.controller");

// Middleware de subida de foto (ya lo usas en auth.routes)
const { userPhotoUpload } = require("../middlewares/upload.middleware");
// Si quieres, luego puedes proteger con token:
// const { verificarToken } = require("../middlewares/auth.middleware");

// Obtener un usuario por id
router.get("/:id", obtenerUsuarioPorId);

// Actualizar foto de perfil (campo "foto")
router.put(
  "/:id/foto",
  userPhotoUpload.single("foto"),
  actualizarFotoPerfil
);

module.exports = router;
