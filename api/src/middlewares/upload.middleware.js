// Archivo: src/middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const baseUploadsDir = process.env.UPLOADS_DIR || "uploads";

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createStorage(subfolder) {
  const uploadPath = path.join(baseUploadsDir, subfolder);
  ensureDirExists(uploadPath);

  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
      cb(null, `${baseName}_${timestamp}${ext}`);
    },
  });
}

// Solo imágenes para foto de usuario
const userPhotoUpload = multer({
  storage: createStorage("users"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    if (!isImage) {
      return cb(new Error("Solo se permiten imágenes para la foto de usuario"));
    }
    cb(null, true);
  },
});

// Imágenes y videos para partes virtuales (máx 100MB por archivo)
const parteFilesUpload = multer({
  storage: createStorage("partes"),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      return cb(new Error("Solo se permiten imágenes o videos"));
    }
    cb(null, true);
  },
});

module.exports = {
  userPhotoUpload,
  parteFilesUpload,
};
