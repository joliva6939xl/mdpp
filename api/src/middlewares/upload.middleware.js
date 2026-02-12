const multer = require("multer");
const path = require("path");
const fs = require("fs");

// RUTA BASE ABSOLUTA
const BASE_UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

// --- HELPER: DEDUCCIÓN DE EXTENSIÓN (LO QUE TE FALTABA) ---
// Si el archivo viene sin extensión, la sacamos del mimetype
const getExtension = (file) => {
  const originalExt = path.extname(file.originalname);
  if (originalExt) return originalExt;

  // Mapa simple para deducir extensiones comunes si faltan
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf'
  };
  return mimeMap[file.mimetype] || ''; // Si no lo conocemos, lo dejamos vacío
};

// --- GENERADOR DE STORAGE (Adaptable) ---
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      // Aquí definimos la subcarpeta: 'usuarios' o 'tmp' (para evidencias)
      const finalPath = path.join(BASE_UPLOAD_DIR, subfolder);
      
      // Creamos la carpeta si no existe (Persistencia)
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }
      cb(null, finalPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = getExtension(file); // <--- USAMOS LA LÓGICA DE DEDUCCIÓN AQUÍ
      
      // Limpiamos el nombre del campo por seguridad
      const fieldName = file.fieldname.replace(/[^a-zA-Z0-9]/g, ""); 
      
      cb(null, `${fieldName}-${uniqueSuffix}${ext}`);
    },
  });
};

// =======================================================
// 1. CONFIGURACIÓN USUARIOS (SEGURO Y LIMPIO)
// =======================================================
// Destino: uploads/usuarios
// Uso: Perfil y Licencia
const uploadUsers = multer({
  storage: createStorage("usuarios"), 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes para el perfil."), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// =======================================================
// 2. CONFIGURACIÓN PARTES / EVIDENCIAS (FLEXIBLE Y TMP)
// =======================================================
// Destino: uploads/tmp (Recuperamos tu flujo temporal)
// Uso: Fotos y Videos de reportes
const uploadPartes = multer({
  storage: createStorage("tmp"), // <--- AQUÍ ESTÁ TU CARPETA TMP
  fileFilter: (req, file, cb) => {
    // Aceptamos todo lo que sea imagen o video
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Formato no soportado. Solo imágenes o videos."), false);
    }
  },
  // Límites más altos para videos
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

module.exports = {
  uploadUsers,
  uploadPartes
};