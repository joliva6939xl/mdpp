// Archivo: src/controllers/partes.controller.js
const path = require("path");
const { query } = require("../config/db");

async function crearParte(req, res, next) {
  try {
    const {
      sector,
      parteFisico,
      zona,
      turno,
      lugar,
      fecha,
      hora,
      unidadTipo,
      unidadNumero,
      placa,
      conductor,
      dniConductor,
      sumilla,
      asunto,
      ocurrencia,
      supZonal,
      supGeneral,
    } = req.body;

    // Por ahora, tomamos el usuario falso del middleware (id 1) o null
    const usuarioId = req.user ? req.user.id : null;

    const insertParteQuery = `
      INSERT INTO partes_virtuales (
        usuario_id, sector, parte_fisico, zona, turno, lugar,
        fecha, hora, unidad_tipo, unidad_numero,
        placa, conductor, dni_conductor, sumilla, asunto,
        ocurrencia, sup_zonal, sup_general
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18
      )
      RETURNING *;
    `;

    const values = [
      usuarioId,
      sector || null,
      parteFisico || null,
      zona || null,
      turno || null,
      lugar || null,
      fecha || null,
      hora || null,
      unidadTipo || null,
      unidadNumero || null,
      placa || null,
      conductor || null,
      dniConductor || null,
      sumilla || null,
      asunto || null,
      ocurrencia || null,
      supZonal || null,
      supGeneral || null,
    ];

    const { rows } = await query(insertParteQuery, values);
    const nuevoParte = rows[0];

    const files = req.files || [];
    const archivosGuardados = [];

    for (const file of files) {
      const tipo = file.mimetype.startsWith("image/") ? "foto" : "video";
      const rutaRelativa = path.join("partes", path.basename(file.path));

      const insertArchivoQuery = `
        INSERT INTO parte_archivos (parte_id, tipo, ruta, nombre_original)
        VALUES ($1, $2, $3, $4)
        RETURNING id, tipo, ruta, nombre_original, creado_en;
      `;

      const { rows: archivoRows } = await query(insertArchivoQuery, [
        nuevoParte.id,
        tipo,
        rutaRelativa,
        file.originalname,
      ]);

      archivosGuardados.push(archivoRows[0]);
    }

    return res.status(201).json({
      ok: true,
      message: "Parte virtual creado correctamente",
      data: {
        parte: nuevoParte,
        archivos: archivosGuardados,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listarPartes(req, res, next) {
  try {
    const { rows } = await query(
      `
      SELECT
        id, usuario_id, sector, parte_fisico, zona, turno,
        lugar, fecha, hora, unidad_tipo, unidad_numero,
        placa, conductor, dni_conductor, sumilla, asunto,
        creado_en
      FROM partes_virtuales
      ORDER BY creado_en DESC;
      `
    );

    return res.json({
      ok: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}

async function obtenerParte(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: parteRows } = await query(
      "SELECT * FROM partes_virtuales WHERE id = $1",
      [id]
    );

    if (parteRows.length === 0) {
      const error = new Error("Parte no encontrado");
      error.status = 404;
      throw error;
    }

    const parte = parteRows[0];

    const { rows: archivosRows } = await query(
      "SELECT id, tipo, ruta, nombre_original, creado_en FROM parte_archivos WHERE parte_id = $1",
      [id]
    );

    return res.json({
      ok: true,
      data: {
        ...parte,
        archivos: archivosRows,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
};
