// api/src/middlewares/upload.middleware.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Carpetas de destino
const evidenciaPath = path.join(__dirname, "../../uploads/evidencias");
const usuariosPath = path.join(__dirname, "../../uploads/usuarios");

if (!fs.existsSync(evidenciaPath)) fs.mkdirSync(evidenciaPath, { recursive: true });
if (!fs.existsSync(usuariosPath)) fs.mkdirSync(usuariosPath, { recursive: true });

// === STORAGE PARA EVIDENCIAS (FOTOS/VIDEOS DE PARTES) ===
const storageEvidencia = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidenciaPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${ext}`);
  },
});

const evidenciaUpload = multer({
  storage: storageEvidencia,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// === STORAGE PARA FOTO DE USUARIO ===
const storageUsuario = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, usuariosPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${ext}`);
  },
});

const userPhotoUpload = multer({
  storage: storageUsuario,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = {
  evidenciaUpload,
  userPhotoUpload,
};
