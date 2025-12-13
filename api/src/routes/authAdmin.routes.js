// Archivo: mdpp/api/src/routes/authAdmin.routes.js
const express = require("express");
const router = express.Router();

const {
  registrarAdmin,
  loginAdmin,
  loginUniversal,
  listarUsuariosApp,
  listarUsuariosAdmin,
  deleteUsuarios,
  getUsuarioDetails,
  getUsuarioPartes,
  toggleBloqueoUsuario,
} = require("../controllers/authAdmin.controller");

// Rutas de Autenticación Admin
router.post("/register-admin", registrarAdmin);

// ✅ LOGIN UNIVERSAL (usa gerencia_usuarios o usuarios o administradores)
router.post("/login", loginUniversal);

// (Opcional) Mantener login de administradores directo si lo necesitas:
router.post("/login-admin", loginAdmin);

// Rutas de Gestión de Usuarios
router.get("/usuarios-app", listarUsuariosApp);
router.get("/usuarios-admin", listarUsuariosAdmin);

// Rutas de Detalles
router.get("/usuario-details/:id", getUsuarioDetails);
router.get("/usuario-partes/:id", getUsuarioPartes);

// Rutas de Acción
router.delete("/delete-usuarios", deleteUsuarios);
router.post("/toggle-bloqueo", toggleBloqueoUsuario);

module.exports = router;
