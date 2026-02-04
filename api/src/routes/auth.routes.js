const express = require("express");
const router = express.Router();

const {
  registrarUsuario,
  loginUsuario,
} = require("../controllers/auth.controller");

const { userPhotoUpload } = require("../middlewares/upload.middleware");

// ✅ CORRECCIÓN: Usamos .fields() para permitir dos archivos distintos
router.post(
  "/register",
  userPhotoUpload.fields([
    { name: "foto", maxCount: 1 },           // Foto de perfil
    { name: "foto_licencia", maxCount: 1 }   // Foto de licencia
  ]),
  registrarUsuario
);

router.post("/login", loginUsuario);

module.exports = router;