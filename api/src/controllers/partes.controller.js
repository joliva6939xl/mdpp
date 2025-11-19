// Archivo: api/src/controllers/partes.controller.js
const { query } = require("../config/db");

// 1. CREAR PARTE (Tu lógica completa original)
async function crearParte(req, res, next) {
  try {
    // 1. Recibimos todo el cuerpo
    const {
      usuario_id, sector, numero_parte_fisico, zona, turno, lugar,
      fecha, hora, unidad, unidad_numero, placa, conductor,
      dni, sumilla, asunto, ocurrencia, supervisor_zonal, supervisor_general,
    } = req.body;

    // 2. 🔍 DIAGNÓSTICO EXACTO: ¿Qué falta?
    const faltantes = [];
    if (!usuario_id) faltantes.push("usuario_id (Error de sesión)");
    if (!sector) faltantes.push("sector");
    if (!fecha) faltantes.push("fecha");

    // Si hay faltantes, detenemos todo y avisamos cuál es
    if (faltantes.length > 0) {
      return res.status(400).json({
        ok: false,
        message: `Faltan datos: ${faltantes.join(", ")}`,
      });
    }

    // 3. Si todo está bien, procedemos a guardar (Tu lógica original intacta)
    const insertQuery = `
      INSERT INTO partes_virtuales (
        usuario_id, sector, parte_fisico, zona, turno, lugar,
        fecha, hora, unidad_tipo, unidad_numero, placa, conductor,
        dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *;
    `;

    const values = [
      usuario_id, sector, numero_parte_fisico || null, zona || null, turno || null, lugar || null,
      fecha || null, hora || null, unidad || null, unidad_numero || null, placa || null, conductor || null,
      dni || null, sumilla || null, asunto || null, ocurrencia || null, supervisor_zonal || null, supervisor_general || null,
    ];

    const { rows } = await query(insertQuery, values);
    return res.json({ ok: true, message: "Parte creado correctamente", data: rows[0] });

  } catch (err) {
    console.error("ERROR crearParte:", err);
    next(err);
  }
}

// 2. LISTAR PARTES
async function listarPartes(req, res, next) {
  try {
    const { usuario_id } = req.query;
    let sql = "SELECT * FROM partes_virtuales";
    const values = [];

    if (usuario_id) {
      sql += " WHERE usuario_id = $1";
      values.push(usuario_id);
    }
    sql += " ORDER BY creado_en DESC;";

    const { rows } = await query(sql, values);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("ERROR listarPartes:", err);
    next(err);
  }
}

// 3. OBTENER PARTE
async function obtenerParte(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query("SELECT * FROM partes_virtuales WHERE id = $1 LIMIT 1;", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: "Parte no encontrado" });
    }
    return res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error("ERROR obtenerParte:", err);
    next(err);
  }
}

// 4. ACTUALIZAR PARTE (Tu lógica completa original)
async function actualizarParte(req, res, next) {
  try {
    const { id } = req.params;
    const {
      usuario_id, sector, parte_fisico, zona, turno, lugar,
      fecha, hora, unidad_tipo, unidad_numero, placa, conductor,
      dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general,
    } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ ok: false, message: "usuario_id obligatorio" });
    }

    const updateQuery = `
      UPDATE partes_virtuales
      SET
        sector=$3, parte_fisico=$4, zona=$5, turno=$6, lugar=$7,
        fecha=$8, hora=$9, unidad_tipo=$10, unidad_numero=$11, placa=$12,
        conductor=$13, dni_conductor=$14, sumilla=$15, asunto=$16, ocurrencia=$17,
        sup_zonal=$18, sup_general=$19
      WHERE id=$1 AND usuario_id=$2
      RETURNING *;
    `;

    const values = [
      id, usuario_id, sector || null, parte_fisico || null, zona || null, turno || null, lugar || null,
      fecha || null, hora || null, unidad_tipo || null, unidad_numero || null, placa || null,
      conductor || null, dni_conductor || null, sumilla || null, asunto || null, ocurrencia || null,
      sup_zonal || null, sup_general || null,
    ];

    const { rows } = await query(updateQuery, values);

    if (rows.length === 0) {
      return res.status(400).json({ ok: false, message: "No se pudo editar (verifica ID o usuario)." });
    }
    return res.json({ ok: true, message: "Parte actualizado", data: rows[0] });
  } catch (err) {
    console.error("ERROR actualizarParte:", err);
    next(err);
  }
}

// EXPORTAMOS EL OBJETO CON LAS FUNCIONES
module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
};