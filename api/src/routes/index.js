// Archivo: mdpp/api/src/routes/index.js
const express = require('express');
const router = express.Router();

// 1. Importar rutas
const partesRoutes = require('./partes.routes');
const authRoutes = require('./auth.routes');
const usuariosRoutes = require('./usuarios.routes');
const authAdminRoutes = require('./authAdmin.routes');

// 2. Función de seguridad para cargar rutas
// Esto evita que el servidor se caiga si un archivo está mal exportado
const cargarRuta = (path, routeModule, nombreArchivo) => {
    if (routeModule && (typeof routeModule === 'function' || typeof routeModule.handle === 'function')) {
        router.use(path, routeModule);
        console.log(`✅ Ruta cargada: ${path}`);
    } else {
        console.error(`❌ ERROR CRÍTICO: El archivo '${nombreArchivo}' no está exportando un router válido.`);
        console.error(`   -> Asegúrate de tener "module.exports = router;" al final de ${nombreArchivo}`);
    }
};

console.log('--- CARGANDO RUTAS ---');

// 3. Asignar rutas usando la función segura
cargarRuta('/partes', partesRoutes, 'partes.routes.js');
cargarRuta('/auth', authRoutes, 'auth.routes.js');
cargarRuta('/usuarios', usuariosRoutes, 'usuarios.routes.js');
cargarRuta('/admin', authAdminRoutes, 'authAdmin.routes.js'); // <--- Aquí veremos si falla la nueva

console.log('----------------------');

module.exports = router;