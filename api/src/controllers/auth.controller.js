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
    const { usuario, dni, contraseña } = req.body;

    // Debe venir usuario o dni
    if (!usuario && !dni) {
      const error = new Error("Usuario o DNI es obligatorio");
      error.status = 400;
      throw error;
    }

    if (!contraseña) {
      const error = new Error("La contraseña es obligatoria");
      error.status = 400;
      throw error;
    }

    // Elegimos si buscamos por usuario o por dni
    const campoLogin = usuario ? "usuario" : "dni";
    const valorLogin = usuario || dni;

    const sql = `
      SELECT
        id,
        nombre,
        dni,
        celular,
        cargo,
        usuario,
        contrasena,
        foto_ruta,
        rol,
        creado_en
      FROM usuarios
      WHERE ${campoLogin} = $1
        AND contrasena = $2
      LIMIT 1;
    `;

    const { rows } = await query(sql, [valorLogin, contraseña]);

    if (rows.length === 0) {
      const error = new Error("Usuario o contraseña incorrectos");
      error.status = 400;
      throw error;
    }

    const u = rows[0];

    // Devolvemos datos reales del usuario
    return res.json({
      ok: true,
      message: "Login correcto",
      data: {
        id: u.id,
        nombre: u.nombre,
        dni: u.dni,
        celular: u.celular,
        cargo: u.cargo,
        usuario: u.usuario,
        rol: u.rol,
        foto_ruta: u.foto_ruta,
        creado_en: u.creado_en,
      },
    });
  } catch (err) {
    console.error("ERROR loginUsuario:", err);
    if (!err.status) err.status = 500;
    next(err);
  }
}

module.exports = {
  registrarUsuario,
  loginUsuario,
};
