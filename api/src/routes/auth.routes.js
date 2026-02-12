const express = require("express");
const router = express.Router();
const { registrarUsuario, loginUsuario } = require("../controllers/auth.controller");

// Importamos el middleware específico de USUARIOS
const { uploadUsers } = require("../middlewares/upload.middleware");

// RUTA REGISTRO APP
router.post(
  "/register", 
  
  // Usamos uploadUsers para que guarde físicamente en 'uploads/usuarios'
  // y habilite la lectura de 'req.files' en el controlador
  uploadUsers.fields([
    { name: "foto", maxCount: 1 },
    { name: "foto_licencia", maxCount: 1 }
  ]),
  
  registrarUsuario
);

router.post("/login", loginUsuario);

module.exports = router;