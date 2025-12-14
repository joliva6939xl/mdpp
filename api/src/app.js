// Archivo: mdpp/api/src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const usuariosRoutes = require("./routes/usuarios.routes");
const authRoutes = require("./routes/auth.routes");               // 1. Auth (Login App)
const authAdminRoutes = require("./routes/authAdmin.routes");     // 2. Admin (Dashboard Web)
const partesRoutes = require("./routes/partes.routes");           // 3. Partes (Formularios App)

// ✅ Call Center
const callcenterRoutes = require("./routes/callcenter.routes");

const app = express();

// --- Middlewares ---
app.use(morgan("dev"));

// Configuración CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Carpeta pública para fotos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- USO DE RUTAS ---
app.use("/api/auth", authRoutes);
app.use("/api/admin", authAdminRoutes);
app.use("/api/partes", partesRoutes);
app.use("/api/usuarios", usuariosRoutes);

// ✅ NUEVO: Call Center
app.use("/api/callcenter", callcenterRoutes);

// Manejo de errores global (DEBE IR AL FINAL)
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(err.status || 500).json({
    ok: false,
    message: err.message || "Error interno del servidor",
  });
});

module.exports = app;
