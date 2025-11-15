// Archivo: src/controllers/partes.controller.js
const { query } = require("../config/db");

// Crear nuevo parte (SIN archivos por ahora)
async function crearParte(req, res, next) {
  try {
    const {
      usuario_id,
      sector,
      numero_parte_fisico,
      zona,
      turno,
      lugar,
      fecha,
      hora,
      unidad,
      unidad_numero,
      placa,
      conductor,
      dni,
      sumilla,
      asunto,
      ocurrencia,
      supervisor_zonal,
      supervisor_general,
    } = req.body;

    if (!usuario_id || !sector || !fecha) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos obligatorios.",
      });
    }

    const insertQuery = `
      INSERT INTO partes_virtuales (
        usuario_id,
        sector,
        parte_fisico,
        zona,
        turno,
        lugar,
        fecha,
        hora,
        unidad_tipo,
        unidad_numero,
        placa,
        conductor,
        dni_conductor,
        sumilla,
        asunto,
        ocurrencia,
        sup_zonal,
        sup_general
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *;
    `;

    const values = [
      usuario_id,
      sector,
      numero_parte_fisico || null,
      zona || null,
      turno || null,
      lugar || null,
      fecha || null,
      hora || null,
      unidad || null,
      unidad_numero || null,
      placa || null,
      conductor || null,
      dni || null,
      sumilla || null,
      asunto || null,
      ocurrencia || null,
      supervisor_zonal || null,
      supervisor_general || null,
    ];

    const { rows } = await query(insertQuery, values);
    const nuevoParte = rows[0];

    return res.json({
      ok: true,
      message: "Parte creado correctamente",
      data: nuevoParte,
    });
  } catch (err) {
    console.error("ERROR crearParte:", err);
    next(err);
  }
}

// Listar partes (opcionalmente por usuario_id)
async function listarPartes(req, res, next) {
  try {
    const { usuario_id } = req.query;

    let sql = `
      SELECT
        id,
        usuario_id,
        sector,
        parte_fisico,
        zona,
        turno,
        lugar,
        fecha,
        hora,
        unidad_tipo,
        unidad_numero,
        placa,
        conductor,
        dni_conductor,
        sumilla,
        asunto,
        ocurrencia,
        sup_zonal,
        sup_general,
        creado_en
      FROM partes_virtuales
    `;
    const values = [];

    if (usuario_id) {
      sql += " WHERE usuario_id = $1";
      values.push(usuario_id);
    }

    sql += " ORDER BY creado_en DESC;";

    const { rows } = await query(sql, values);

    return res.json({
      ok: true,
      data: rows,
    });
  } catch (err) {
    console.error("ERROR listarPartes:", err);
    next(err);
  }
}

// Detalle de parte por id
async function obtenerParte(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `
      SELECT
        id,
        usuario_id,
        sector,
        parte_fisico,
        zona,
        turno,
        lugar,
        fecha,
        hora,
        unidad_tipo,
        unidad_numero,
        placa,
        conductor,
        dni_conductor,
        sumilla,
        asunto,
        ocurrencia,
        sup_zonal,
        sup_general,
        creado_en
      FROM partes_virtuales
      WHERE id = $1
      LIMIT 1;
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Parte no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("ERROR obtenerParte:", err);
    next(err);
  }
}

// 🔹 NUEVO: actualizar parte (solo creador, solo 10 minutos)
async function actualizarParte(req, res, next) {
  try {
    const { id } = req.params;

    const {
      usuario_id,
      sector,
      parte_fisico,
      zona,
      turno,
      lugar,
      fecha,
      hora,
      unidad_tipo,
      unidad_numero,
      placa,
      conductor,
      dni_conductor,
      sumilla,
      asunto,
      ocurrencia,
      sup_zonal,
      sup_general,
    } = req.body;

    if (!usuario_id) {
      return res.status(400).json({
        ok: false,
        message: "usuario_id es obligatorio para editar.",
      });
    }

    const updateQuery = `
      UPDATE partes_virtuales
      SET
        sector        = $3,
        parte_fisico  = $4,
        zona          = $5,
        turno         = $6,
        lugar         = $7,
        fecha         = $8,
        hora          = $9,
        unidad_tipo   = $10,
        unidad_numero = $11,
        placa         = $12,
        conductor     = $13,
        dni_conductor = $14,
        sumilla       = $15,
        asunto        = $16,
        ocurrencia    = $17,
        sup_zonal     = $18,
        sup_general   = $19
      WHERE id = $1
        AND usuario_id = $2
        AND creado_en >= NOW() - INTERVAL '10 minutes'
      RETURNING *;
    `;

    const values = [
      id,
      usuario_id,
      sector || null,
      parte_fisico || null,
      zona || null,
      turno || null,
      lugar || null,
      fecha || null,
      hora || null,
      unidad_tipo || null,
      unidad_numero || null,
      placa || null,
      conductor || null,
      dni_conductor || null,
      sumilla || null,
      asunto || null,
      ocurrencia || null,
      sup_zonal || null,
      sup_general || null,
    ];

    const { rows } = await query(updateQuery, values);

    if (rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message:
          "No se puede editar el parte. Puede que ya hayan pasado más de 10 minutos o que no seas el creador.",
      });
    }

    return res.json({
      ok: true,
      message: "Parte actualizado correctamente",
      data: rows[0],
    });
  } catch (err) {
    console.error("ERROR actualizarParte:", err);
    next(err);
  }
}

module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
};
