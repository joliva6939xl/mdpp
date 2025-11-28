// api/src/controllers/usuarios.controller.js

const db = require("../config/db");
const pool = db.pool || db;

/**
 * Obtener un usuario por id
 * GET /api/usuarios/:id
 */
const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Obteniendo usuario id=${id}`);

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE id = $1;",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    return res.json({
      ok: true,
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener usuario",
      error: error.message,
    });
  }
};

/**
 * Actualizar foto de perfil de un usuario
 * PUT /api/usuarios/:id/foto
 * espera un campo de formulario: "foto"
 */
const actualizarFotoPerfil = async (req, res) => {
  const { id } = req.params;
  console.log(`🖼️ Actualizando foto de usuario id=${id}`);
  console.log("👉 req.file:", req.file);

  if (!req.file) {
    return res.status(400).json({
      ok: false,
      message: "No se envió archivo de foto",
    });
  }

  const rutaRelativa = `uploads/usuarios/${req.file.filename}`;
  const baseUrl = process.env.BASE_URL || "http://localhost:4000";
  const fotoUrl = `${baseUrl}/${rutaRelativa}`;

  try {
    // Si tu columna se llama distinto, luego ajustamos este nombre.
    const updateQuery = `
      UPDATE usuarios
      SET foto_ruta = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [rutaRelativa, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    const usuario = result.rows[0];

    return res.json({
      ok: true,
      message: "Foto de perfil actualizada correctamente",
      fotoUrl,
      usuario,
    });
  } catch (error) {
    console.error("❌ Error al actualizar foto de usuario:", error);
    return res.status(500).json({
      ok: false,
      message:
        "Error al guardar la foto de perfil (revisa el nombre de la columna 'foto_ruta' en la tabla usuarios)",
      error: error.message,
      fotoUrl,
    });
  }
};

module.exports = {
  obtenerUsuarioPorId,
  actualizarFotoPerfil,
};
