// api/src/controllers/partes.controller.js
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const pool = db.pool || db;

// CREAR PARTE VIRTUAL
const crearParte = async (req, res) => {
  console.log("📥 Creando Parte Virtual...");
  const client = await pool.connect();

  const {
    parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar,
    unidad_tipo, unidad_numero, placa, conductor, dni_conductor,
    sumilla, asunto, ocurrencia, sup_zonal, sup_general,
    usuario_id, participantes,
    latitud, longitud 
  } = req.body;

  try {
    await client.query("BEGIN");

    const insertParteQuery = `
      INSERT INTO partes_virtuales (
        parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar,
        unidad_tipo, unidad_numero, placa, conductor, dni_conductor,
        sumilla, asunto, ocurrencia, sup_zonal, sup_general,
        participantes, usuario_id,
        latitud, longitud 
      ) VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,
        $9,  $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22
      )
      RETURNING id;
    `;

    let participantesValue = null;
    if (participantes) {
      try {
        const parsed = typeof participantes === "string" ? JSON.parse(participantes) : participantes;
        if (Array.isArray(parsed) && parsed.length > 0) participantesValue = JSON.stringify(parsed);
      } catch (e) { console.warn("⚠️ Error parseando participantes"); }
    }

    const valuesParte = [
      parte_fisico, fecha, hora || null, hora_fin?.trim() || null, sector, zona, turno, lugar,
      unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia,
      sup_zonal, sup_general, participantesValue, usuario_id,
      latitud || null, longitud || null
    ];

    const result = await client.query(insertParteQuery, valuesParte);
    const parteId = result.rows[0].id;

    const carpetaParte = path.join(__dirname, "../../uploads/partes", String(parteId));
    if (!fs.existsSync(carpetaParte)) fs.mkdirSync(carpetaParte, { recursive: true });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const newPath = path.join(carpetaParte, file.filename);
        fs.renameSync(file.path, newPath);
        const rutaRelativa = path.join("partes", String(parteId), file.filename).replace(/\\/g, "/");
        const tipo = file.mimetype.startsWith("video") ? "video" : "foto";
        await client.query(
          `INSERT INTO parte_archivos (parte_id, tipo, ruta, nombre_original) VALUES ($1, $2, $3, $4)`,
          [parteId, tipo, rutaRelativa, file.originalname || file.filename]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true, message: "Parte creado con ubicación", id: parteId });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error crearParte:", error);
    res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  } finally {
    client.release();
  }
};

// LISTAR PARTES
const listarPartes = async (req, res) => {
  const { usuario_id, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query, countQuery, params, countParams;
    if (usuario_id) {
      query = `SELECT * FROM partes_virtuales WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3;`;
      params = [usuario_id, limitNum, offset];
      countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales WHERE usuario_id = $1;`;
      countParams = [usuario_id];
    } else {
      query = `SELECT * FROM partes_virtuales ORDER BY id DESC LIMIT $1 OFFSET $2;`;
      params = [limitNum, offset];
      countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales;`;
      countParams = [];
    }
    const result = await pool.query(query, params);
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].total);
    return res.json({ ok: true, partes: result.rows, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("❌ Error al listar partes:", error);
    return res.status(500).json({ ok: false, message: "Error", error: error.message });
  }
};

// OBTENER DETALLE (CORREGIDO: Ahora incluye latitud y longitud)
const obtenerParte = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Obteniendo parte param=${id}`);

  try {
    // ✅ AQUÍ ESTABA EL PROBLEMA: Agregamos latitud y longitud al SELECT
    const parteQuery = `
      SELECT
        id, parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar,
        unidad_tipo, unidad_numero, placa, conductor, dni_conductor,
        sumilla, asunto, ocurrencia, sup_zonal AS supervisor_zonal,
        sup_general AS supervisor_general, participantes, usuario_id,
        latitud, longitud 
      FROM partes_virtuales
      WHERE parte_fisico = $1 OR id::text = $1
      LIMIT 1;
    `;

    const parteResult = await pool.query(parteQuery, [id]);

    if (parteResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Parte no encontrado" });
    }

    const parte = parteResult.rows[0];
    const parteId = parte.id;

    // Normalizar participantes
    if (parte.participantes && typeof parte.participantes === "string") {
      try {
        const parsed = JSON.parse(parte.participantes);
        parte.participantes = Array.isArray(parsed) ? parsed : [];
      } catch (e) { parte.participantes = []; }
    } else if (!parte.participantes) {
      parte.participantes = [];
    }

    const archivosResult = await pool.query(
      `SELECT ruta, tipo FROM parte_archivos WHERE parte_id = $1`,
      [parteId]
    );
    const archivos = archivosResult.rows || [];

    parte.fotos = archivos.filter(a => a.tipo === 'foto' || a.ruta.match(/\.(jpg|jpeg|png|webp)$/i)).map(a => a.ruta);
    parte.videos = archivos.filter(a => a.tipo === 'video' || a.ruta.match(/\.(mp4|avi|mov)$/i)).map(a => a.ruta);

    return res.json({ ok: true, parte, data: parte });
  } catch (error) {
    console.error("❌ Error al obtener parte:", error);
    return res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  }
};

// ACTUALIZAR PARTE
const actualizarParte = async (req, res) => {
  const { id } = req.params;
  const {
    parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar,
    unidad_tipo, unidad_numero, placa, conductor, dni_conductor,
    sumilla, asunto, ocurrencia, sup_zonal, sup_general,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE partes_virtuales SET
        parte_fisico = $1, fecha = $2, hora = $3, hora_fin = $4,
        sector = $5, zona = $6, turno = $7, lugar = $8,
        unidad_tipo = $9, unidad_numero = $10, placa = $11,
        conductor = $12, dni_conductor = $13, sumilla = $14,
        asunto = $15, ocurrencia = $16, sup_zonal = $17, sup_general = $18
      WHERE parte_fisico = $19 OR id::text = $19
      RETURNING *;`,
      [
        parte_fisico, fecha, hora, hora_fin || null, sector, zona, turno, lugar,
        unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla,
        asunto, ocurrencia, sup_zonal, sup_general, id
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: "Parte no encontrado para actualizar" });
    return res.json({ ok: true, message: "Parte actualizado", parte: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    return res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  }
};

// CERRAR PARTE
const cerrarParte = async (req, res) => {
  const { id } = req.params;
  const { hora_fin } = req.body || {};
  const horaFinFinal = hora_fin && hora_fin.trim() !== "" ? hora_fin.trim() : null;

  try {
    let result;
    if (horaFinFinal) {
      result = await pool.query(
        `UPDATE partes_virtuales SET hora_fin = $2 WHERE parte_fisico = $1 OR id::text = $1 RETURNING *;`,
        [id, horaFinFinal]
      );
    } else {
      result = await pool.query(
        `UPDATE partes_virtuales SET hora_fin = TO_CHAR(NOW(), 'HH24:MI') WHERE parte_fisico = $1 OR id::text = $1 RETURNING *;`,
        [id]
      );
    }

    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: "Parte no encontrado" });
    return res.json({ ok: true, message: "Parte cerrado correctamente", parte: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al cerrar parte:", error);
    return res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  }
};

// ESTADÍSTICAS CALL CENTER
const obtenerEstadisticasCallCenter = async (req, res) => {
    const { fecha, turno } = req.query;
    try {
      const text = `SELECT id, zona, turno FROM partes_virtuales WHERE fecha::text LIKE $1 || '%'`;
      const result = await pool.query(text, [fecha]);
      const todos = result.rows;
      const stats = { Norte: 0, Centro: 0, Sur: 0, Total: 0 };
      const turnoReq = (turno || "").toUpperCase().trim();

      todos.forEach(row => {
          const dbTurno = (row.turno || "").toUpperCase().trim();
          const dbZona = (row.zona || "").toUpperCase().trim();
          let coincide = false;
          if (turnoReq === "TURNO DIA") {
             if (["MAÑANA", "TARDE", "DIA", "TURNO DIA", "TURNO DÍA"].includes(dbTurno)) coincide = true;
          } else if (turnoReq === "TURNO NOCHE") {
             if (["NOCHE", "TURNO NOCHE"].includes(dbTurno)) coincide = true;
          } else {
             if (dbTurno === turnoReq) coincide = true;
          }
          if (coincide) {
              if (dbZona === 'NORTE') stats.Norte++;
              else if (dbZona === 'CENTRO') stats.Centro++;
              else if (dbZona === 'SUR') stats.Sur++;
          }
      });
      stats.Total = stats.Norte + stats.Centro + stats.Sur;
      res.json(stats);
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  };

module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
  cerrarParte,
  obtenerEstadisticasCallCenter
};