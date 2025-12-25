const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");

// Tu configuración original de Multer para las fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "src/uploads/usuarios"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const { 
    getUsuarios, 
    obtenerUsuarioPorId, 
    actualizarFotoPerfil,
    verPartesUsuario 
} = require("../controllers/usuarios.controller");

// 🟢 Rutas sumadas y originales trabajando juntas
router.get("/", getUsuarios);                   // Lista
router.get("/:id", obtenerUsuarioPorId);        // Detalle
router.put("/:id/foto", upload.single("foto"), actualizarFotoPerfil); // ✅ Tu ruta de fotos
router.get("/:id/partes", verPartesUsuario);    // Partes del usuario

module.exports = router;