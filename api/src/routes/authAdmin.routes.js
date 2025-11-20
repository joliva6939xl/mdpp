// Archivo: mdpp/api/src/routes/authAdmin.routes.js
const express = require('express');
const router = express.Router();
const authAdminController = require('../controllers/authAdmin.controller');

// Rutas de Autenticación
router.post('/register-admin', authAdminController.registrarAdmin);
router.post('/login', authAdminController.loginAdmin);

// Rutas de Gestión de Usuarios (NUEVAS)
// Usamos GET porque solo vamos a leer datos
router.get('/usuarios-app', authAdminController.listarUsuariosApp);
router.get('/usuarios-admin', authAdminController.listarUsuariosAdmin);

module.exports = router;