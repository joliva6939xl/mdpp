// Archivo: src/controllers/auth.controller.js
const path = require("path");
const { query } = require("../config/db");

// misma lógica que en el móvil para generar usuario
function generarUsuario(nombreCompleto) {
  if (!nombreCompleto || !nombreCompleto.trim()) return "";

  const partes = nombreCompleto.trim().toLowerCase().split(" ");
  const nombrePrimero = partes[0];
  const apellido = partes[1] || "";

  if (!apellido) {
    return nombrePrimero;
  }

  const usuario = nombrePrimero[0] + apellido;
  return usuario.replace(/[^a-z0-9]/g, "");
}

async function registrarUsuario(req, res, next) {
  try {
    const { nombre, dni, celular, cargo } = req.body;
    const foto = req.file; // foto del usuario

    if (!nombre || !dni || !cargo) {
      const error = new Error("Nombre, DNI y cargo son obligatorios");
      error.status = 400;
      throw error;
    }

    const usuario = generarUsuario(nombre);
    const contraseña = dni; // contraseña lógica = DNI

    let fotoRuta = null;
    if (foto) {
      fotoRuta = path.join("users", path.basename(foto.path));
    }

    const insertQuery = `
      INSERT INTO usuarios (
        nombre,
        dni,
        celular,
        cargo,
        usuario,
        contrasena,
        foto_ruta,
        rol
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'agente'
      )
      RETURNING
        id,
        nombre,
        dni,
        celular,
        cargo,
        usuario,
        foto_ruta,
        rol,
        creado_en;
    `;

    const values = [
      nombre,
      dni,
      celular || null,
      cargo,
      usuario,
      contraseña,
      fotoRuta,
    ];

    const { rows } = await query(insertQuery, values);
    const nuevoUsuario = rows[0];

    return res.status(201).json({
      ok: true,
      message: "Usuario registrado correctamente",
      data: {
        ...nuevoUsuario,
        // devolvemos la contraseña solo para desarrollo
        contraseña,
      },
    });
  } catch (err) {
    if (err.code === "23505") {
      err.message = "El DNI o usuario ya está registrado";
      err.status = 400;
    }
    next(err);
  }
}

// login simple solo por DNI (para futuro)
async function loginUsuario(req, res, next) {
  try {
    const { dni } = req.body;

    if (!dni) {
      const error = new Error("DNI es obligatorio");
      error.status = 400;
      throw error;
    }

    const { rows } = await query(
      "SELECT id, nombre, dni, usuario, cargo, rol FROM usuarios WHERE dni = $1",
      [dni]
    );

    if (rows.length === 0) {
      const error = new Error("Usuario no encontrado");
      error.status = 404;
      throw error;
    }

    const user = rows[0];

    return res.json({
      ok: true,
      message: "Login correcto (solo desarrollo, sin token todavía)",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registrarUsuario,
  loginUsuario,
};
