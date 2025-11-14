// Archivo: src/middlewares/auth.middleware.js
// Por ahora solo un "placeholder" para futuro JWT / roles

function fakeAuth(req, res, next) {
  // En el futuro: leer token, verificar usuario, roles, etc.
  // De momento, simulamos un usuario con id 1
  req.user = {
    id: 1,
    rol: "agente",
  };
  next();
}

module.exports = {
  fakeAuth,
};
