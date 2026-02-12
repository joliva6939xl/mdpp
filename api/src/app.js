const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// 1. IMPORTACIÓN DE RUTAS
const usuariosRoutes = require("./routes/usuarios.routes");
const authRoutes = require("./routes/auth.routes");
const authAdminRoutes = require("./routes/authAdmin.routes");
const partesRoutes = require("./routes/partes.routes");
const callcenterRoutes = require("./routes/callcenter.routes");
const reportesExternosRoutes = require("./routes/reportesExternos.routes");

const app = express();

// 2. MIDDLEWARES
app.use(morgan("dev"));
// Permite que la App y la Web se conecten desde cualquier IP
app.use(cors({ origin: "*" })); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// =================================================================
// 3. 🔥 CONFIGURACIÓN DE IMÁGENES (DOBLE BÚSQUEDA) 🔥
// =================================================================
// Esto es lo que pediste: Compatibilidad total.

// A) Carpeta Nueva (Fuera de src) - Donde guarda el nuevo sistema
const uploadsNew = path.resolve(__dirname, "../uploads");

// B) Carpeta Antigua (Dentro de src) - Donde están las fotos viejas
const uploadsLegacy = path.resolve(__dirname, "uploads");

console.log("📂 Configurando rutas de imágenes:");
console.log("   1. Buscando en (Nuevo):", uploadsNew);
console.log("   2. Buscando en (Viejo):", uploadsLegacy);

// Express buscará en orden: Primero en la carpeta nueva, luego en la vieja.
// Si la foto está en CUALQUIERA de las dos, la mostrará.
app.use("/uploads", express.static(uploadsNew));
app.use("/uploads", express.static(uploadsLegacy));


// 4. REGISTRO DE RUTAS API
app.use("/api/auth", authRoutes);
app.use("/api/admin", authAdminRoutes);
app.use("/api/partes", partesRoutes); 
app.use("/api/usuarios", usuariosRoutes);

// Rutas condicionales (Solo si los archivos existen y no dan error al importar)
if (callcenterRoutes) app.use("/api/callcenter", callcenterRoutes);
if (reportesExternosRoutes) app.use("/api/exportar", reportesExternosRoutes);

// 5. MANEJO DE ERRORES GLOBAL
app.use((err, req, res, next) => {
  console.error("❌ Error del servidor:", err);
  res.status(500).json({ message: err.message });
});

module.exports = app;