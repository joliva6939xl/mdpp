const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// 1. Importación de Rutas
const usuariosRoutes = require("./routes/usuarios.routes");
const authRoutes = require("./routes/auth.routes");
const authAdminRoutes = require("./routes/authAdmin.routes");
const partesRoutes = require("./routes/partes.routes");
const callcenterRoutes = require("./routes/callcenter.routes");
const reportesExternosRoutes = require("./routes/reportesExternos.routes");

const app = express();

// 2. Middlewares
app.use(morgan("dev"));
app.use(cors({ origin: "*" })); // Permite acceso total
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 3. ⚠️ CONFIGURACIÓN DE IMÁGENES (REPARADA) ⚠️
// Configuramos DOS rutas posibles para asegurar que encuentre las fotos antiguas y nuevas
const uploadsInsideSrc = path.join(__dirname, "uploads");    // mdpp/api/src/uploads
const uploadsOutsideSrc = path.join(__dirname, "../uploads"); // mdpp/api/uploads

console.log("📂 Buscando imágenes en:", uploadsInsideSrc);
console.log("📂 Y también en:", uploadsOutsideSrc);

app.use("/uploads", express.static(uploadsInsideSrc));
app.use("/uploads", express.static(uploadsOutsideSrc));

// 4. REGISTRO DE TODAS LAS RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/admin", authAdminRoutes);
app.use("/api/partes", partesRoutes);     // ✅ Esto recupera los Partes Virtuales
app.use("/api/usuarios", usuariosRoutes); // ✅ Esto permite ver los usuarios
app.use("/api/callcenter", callcenterRoutes);
app.use("/api/exportar", reportesExternosRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("❌ Error del servidor:", err);
  res.status(500).json({ message: err.message });
});

module.exports = app;