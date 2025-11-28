const multer = require("multer");
const path = require("path");
const fs = require("fs");

const baseUploadDir = path.resolve(__dirname, "../../uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Storage para evidencias (fotos / videos) de partes_virtuales
const evidenciaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(baseUploadDir, "tmp");
    ensureDir(tmpDir);
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extFromName = path.extname(file.originalname || "");
    let ext = extFromName;

    if (!ext) {
      if ((file.mimetype || "").startsWith("video")) {
        ext = ".mp4";
      } else {
        ext = ".jpg";
      }
    }

    cb(null, `${unique}${ext}`);
  },
});

// Storage para foto de perfil de usuario
const usuarioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(baseUploadDir, "usuarios");
    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extFromName = path.extname(file.originalname || "");
    const ext = extFromName || ".jpg";
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage: evidenciaStorage });       // 👉 para PARTES
const userPhotoUpload = multer({ storage: usuarioStorage }); // 👉 para FOTO PERFIL

module.exports = { upload, userPhotoUpload };
