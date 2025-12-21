const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const usuariosRoutes = require("./routes/usuarios.routes");
const authRoutes = require("./routes/auth.routes");
const authAdminRoutes = require("./routes/authAdmin.routes");
const partesRoutes = require("./routes/partes.routes");
const callcenterRoutes = require("./routes/callcenter.routes");

const app = express();

app.use(morgan("dev"));

// 🟢 CONFIGURACIÓN CORS PERMISIVA
// Esto permite que el Frontend pida lo que sea sin bloqueos
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires"],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🟢 LOG PARA VER SI LA RUTA ES CORRECTA
const uploadsPath = path.join(__dirname, "../uploads");
console.log("📂 [BACKEND] Carpeta pública configurada en:", uploadsPath);

app.use("/uploads", express.static(uploadsPath));

app.use("/api/auth", authRoutes);
app.use("/api/admin", authAdminRoutes);
app.use("/api/partes", partesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/callcenter", callcenterRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ ok: false, message: err.message });
});

module.exports = app;