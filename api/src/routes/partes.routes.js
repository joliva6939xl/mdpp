// api/src/routes/partes.routes.js
const express = require("express");
const router = express.Router();

// ==================== CONTROLADOR ====================
const partesController = require("../controllers/partes.controller");

// si por alguna razón el require no tiene estas funciones,
// las envolvemos en una función segura para que Express no reviente.
const crearParte =
  partesController && typeof partesController.crearParte === "function"
    ? partesController.crearParte
    : (req, res) => {
        console.error("crearParte no está definido correctamente");
        return res.status(500).json({
          ok: false,
          message: "Error interno: crearParte no definido",
        });
      };

const listarPartes =
  partesController && typeof partesController.listarPartes === "function"
    ? partesController.listarPartes
    : (req, res) => {
        console.error("listarPartes no está definido correctamente");
        return res.status(500).json({
          ok: false,
          message: "Error interno: listarPartes no definido",
        });
      };

const obtenerParte =
  partesController && typeof partesController.obtenerParte === "function"
    ? partesController.obtenerParte
    : (req, res) => {
        console.error("obtenerParte no está definido correctamente");
        return res.status(500).json({
          ok: false,
          message: "Error interno: obtenerParte no definido",
        });
      };

const actualizarParte =
  partesController && typeof partesController.actualizarParte === "function"
    ? partesController.actualizarParte
    : (req, res) => {
        console.error("actualizarParte no está definido correctamente");
        return res.status(500).json({
          ok: false,
          message: "Error interno: actualizarParte no definido",
        });
      };

// ==================== MIDDLEWARES ====================
// Corregimos la importación para que sea directa y sin lógicas complejas
const { fakeAuth: verificarToken } = require("../middlewares/auth.middleware");
const { evidenciaUpload } = require("../middlewares/upload.middleware");

// Obtenemos directamente el middleware de multer para subir múltiples archivos
const evidenciaArrayMiddleware = evidenciaUpload.array("evidencia", 10);


// ==================== RUTAS ====================

// Crear parte (con evidencias opcionales)
// Usamos el middleware corregido
router.post("/", verificarToken, evidenciaArrayMiddleware, crearParte);

// Listar partes
router.get("/", verificarToken, listarPartes);

// Ver detalle de una parte
router.get("/:id", verificarToken, obtenerParte);

// Actualizar parte (solo datos, si luego quieres permitir cambio de archivos
// puedes agregar evidenciaArrayMiddleware aquí también)
router.put("/:id", verificarToken, actualizarParte);

module.exports = router;
