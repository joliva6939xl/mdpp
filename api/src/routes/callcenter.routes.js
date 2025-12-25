const { Router } = require("express");
const router = Router();

// Importamos TODO el controlador
const controller = require("../controllers/callcenter.controller");

// 🛡️ DIAGNÓSTICO DE SEGURIDAD
// Si esto imprime "undefined" o "{}", el problema es el archivo del controlador.
console.log("🔍 [DEBUG] Controlador importado:", controller);

if (!controller.getConteoStats) {
    console.error("❌ ERROR CRÍTICO: La función 'getConteoStats' no existe en el controlador.");
    // Esto evita que la app se cierre de golpe y te deja ver el error
    router.get("/stats", (req, res) => res.status(500).send("Error de configuración en servidor"));
} else {
    // Si existe, definimos la ruta correctamente
    router.get("/stats", controller.getConteoStats);
}

module.exports = router;