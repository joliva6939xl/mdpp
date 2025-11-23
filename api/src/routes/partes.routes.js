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

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = require("../middlewares/auth.middleware");

const verificarToken =
  typeof authMiddleware === "function"
    ? authMiddleware
    : typeof authMiddleware?.verificarToken === "function"
    ? authMiddleware.verificarToken
    : (req, res, next) => {
        // Fallback: si aún no tienes auth bien implementado, no rompemos el server
        console.warn(
          "verificarToken no definido correctamente, se deja pasar la petición sin validar token"
        );
        next();
      };

// ==================== UPLOAD MIDDLEWARE ====================
const uploadMiddleware = require("../middlewares/upload.middleware");

// soporta tanto:
// module.exports = { evidenciaUpload, ... }
// como
// module.exports = upload
const evidenciaUpload =
  uploadMiddleware?.evidenciaUpload || uploadMiddleware;

// middleware para múltiples archivos "evidencia"
const evidenciaArrayMiddleware =
  evidenciaUpload && typeof evidenciaUpload.array === "function"
    ? evidenciaUpload.array("evidencia", 10)
    : (req, res, next) => {
        console.warn(
          "evidenciaUpload.array no definido, se continúa sin procesar archivos"
        );
        next();
      };

// ==================== RUTAS ====================

// Crear parte (con evidencias opcionales)
router.post("/", verificarToken, evidenciaArrayMiddleware, crearParte);

// Listar partes
router.get("/", verificarToken, listarPartes);

// Ver detalle de una parte
router.get("/:id", verificarToken, obtenerParte);

// Actualizar parte (solo datos, si luego quieres permitir cambio de archivos
// puedes agregar evidenciaArrayMiddleware aquí también)
router.put("/:id", verificarToken, actualizarParte);

module.exports = router;
