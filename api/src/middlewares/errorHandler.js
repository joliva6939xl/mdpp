// Archivo: src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error("ERROR:", err);

  const status = err.status || 500;
  const message = err.message || "Error interno del servidor";

  res.status(status).json({
    ok: false,
    message,
  });
}

module.exports = errorHandler;
