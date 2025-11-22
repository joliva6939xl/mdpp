// Archivo: mdpp/api/src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require("./routes/auth.routes");           // 1. Auth (Login App)
const authAdminRoutes = require("./routes/authAdmin.routes"); // 2. Admin (Dashboard Web)

// ⚠️ AQUÍ ESTABA EL ERROR: Faltaba importar las rutas de Partes
// Asumo que el archivo se llama 'partes.routes.js' basado en la estructura de tu proyecto
const partesRoutes = require("./routes/partes.routes");       // 3. Partes (Formularios App)

const app = express();

// --- Middlewares ---
app.use(morgan("dev"));

// Configuración CORS
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Carpeta pública para fotos
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// --- USO DE RUTAS ---

// 1. Rutas de Autenticación
app.use("/api/auth", authRoutes);

// 2. Rutas de Administración
app.use("/api/admin", authAdminRoutes);

// 3. Rutas de Partes (RE-CONECTADO)
// Esto soluciona el error 404 en el POST /api/partes
app.use("/api/partes", partesRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error("Error no controlado:", err);
    res.status(err.status || 500).json({
        ok: false,
        message: err.message || "Error interno del servidor"
    });
});

module.exports = app;