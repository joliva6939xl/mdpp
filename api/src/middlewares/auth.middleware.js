const jwt = require("jsonwebtoken");

// Middleware muy permisivo: si hay token lo lee, si no, deja pasar igual
const verificarToken = (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log(
      "verificarToken no definido correctamente, se deja pasar la petición sin validar token"
    );
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET || "mdpp_super_secreto";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
  } catch (err) {
    console.log("Error verificando token:", err.message);
  }

  return next();
};

module.exports = { verificarToken };
