// Archivo: api/src/routes/partes.routes.js
const express = require("express");
const router = express.Router();

// Importamos las funciones que acabamos de definir en el Controlador
const {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
} = require("../controllers/partes.controller");

// Definimos las URLs
router.post("/", crearParte);       // Crear
router.get("/", listarPartes);      // Listar
router.get("/:id", obtenerParte);   // Ver detalle
router.put("/:id", actualizarParte); // Editar

// ESTA LÍNEA ES LA SOLUCIÓN AL ERROR "got a Object"
// Exportamos el Router, NO el objeto de funciones
module.exports = router;