const db = require("../config/db");
const pool = db.pool || db;

/**
 * 🔵 1. OBTENER POR ID (TU CÓDIGO ORIGINAL - PROTEGIDO)
 */
const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Obteniendo usuario id=${id}`);
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE id = $1;", [id]);
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: "No encontrado" });
    return res.json({ ok: true, usuario: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error", error: error.message });
  }
};

/**
 * 🔵 2. ACTUALIZAR FOTO DE PERFIL (TU CÓDIGO ORIGINAL - RECUPERADO)
 * No se borra ni se modifica una sola coma de esta función.
 */
const actualizarFotoPerfil = async (req, res) => {
  const { id } = req.params;
  console.log(`🖼️ Actualizando foto de usuario id=${id}`);
  if (!req.file) return res.status(400).json({ ok: false, message: "No se envió archivo de foto" });

  const rutaRelativa = `uploads/usuarios/${req.file.filename}`;
  const baseUrl = process.env.BASE_URL || "http://localhost:4000";
  const fotoUrl = `${baseUrl}/${rutaRelativa}`;

  try {
    const updateQuery = `UPDATE usuarios SET foto_ruta = $1 WHERE id = $2 RETURNING *;`;
    const result = await pool.query(updateQuery, [rutaRelativa, id]);

    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    return res.json({
      ok: true,
      message: "Foto de perfil actualizada correctamente",
      fotoUrl,
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar foto de usuario:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al guardar la foto de perfil",
      error: error.message,
      fotoUrl,
    });
  }
};

/**
 * 🟢 3. LISTAR TODOS (SUMADO PARA EL DASHBOARD)
 */
const getUsuarios = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.status(200).json(response.rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios" });
    }
};

/**
 * 🟢 4. VER PARTES (SUMADO PARA EL MODAL TIPO ADMIN)
 */
const verPartesUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const partes = await pool.query("SELECT * FROM partes_virtuales WHERE usuario_id = $1 ORDER BY fecha DESC", [id]);
        res.json({ ok: true, partes: partes.rows });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
};

// EXPORTACIÓN SINÉRGICA COMPLETA
module.exports = {
  obtenerUsuarioPorId, // ✅ Original
  actualizarFotoPerfil, // ✅ Original Protegida
  getUsuarios,          // ✅ Sumada
  verPartesUsuario      // ✅ Sumada
};