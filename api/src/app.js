const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// 1. Importación de Rutas
const usuariosRoutes = require("./routes/usuarios.routes");
const authRoutes = require("./routes/auth.routes");
const authAdminRoutes = require("./routes/authAdmin.routes");
const partesRoutes = require("./routes/partes.routes");
// Rutas nuevas que añadimos
const callcenterRoutes = require("./routes/callcenter.routes");
const reportesExternosRoutes = require("./routes/reportesExternos.routes");

const app = express();

// 2. Middlewares
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 3. Configuración de Imágenes
const carpetaSrc = path.join(__dirname, "uploads");
const carpetaRoot = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(carpetaSrc));
app.use("/uploads", express.static(carpetaRoot));

// 4. REGISTRO DE TODAS LAS RUTAS (Aquí estaba el fallo de conexión)
app.use("/api/auth", authRoutes);
app.use("/api/admin", authAdminRoutes);
app.use("/api/partes", partesRoutes);
app.use("/api/usuarios", usuariosRoutes); // ✅ Permite ver usuarios

// ✅ NUEVAS RUTAS ESENCIALES
app.use("/api/callcenter", callcenterRoutes);  // Alimenta el tablero
app.use("/api/exportar", reportesExternosRoutes); // Genera el Word

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("❌ Error del servidor:", err);
  res.status(500).json({ message: err.message });
});

module.exports = app;