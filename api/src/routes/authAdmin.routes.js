// Archivo: mdpp/api/src/routes/authAdmin.routes.js
const express = require('express');
const router = express.Router();
const { 
    registrarAdmin, 
    loginAdmin, 
    listarUsuariosApp, 
    listarUsuariosAdmin,
    deleteUsuarios,
    getUsuarioDetails,
    getUsuarioPartes,
    toggleBloqueoUsuario // <--- Importamos nueva función
} = require('../controllers/authAdmin.controller');

// Rutas de Autenticación Admin
router.post('/register-admin', registrarAdmin);
router.post('/login', loginAdmin);

// Rutas de Gestión de Usuarios
router.get('/usuarios-app', listarUsuariosApp);
router.get('/usuarios-admin', listarUsuariosAdmin);

// Rutas de Detalles
router.get('/usuario-details/:id', getUsuarioDetails); 
router.get('/usuario-partes/:id', getUsuarioPartes);   

// Rutas de Acción
router.delete('/delete-usuarios', deleteUsuarios);
router.post('/toggle-bloqueo', toggleBloqueoUsuario); // <--- NUEVA RUTA

module.exports = router;