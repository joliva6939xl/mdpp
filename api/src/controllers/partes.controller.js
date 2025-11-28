// api/src/controllers/partes.controller.js
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

// Soporta tanto module.exports = pool como module.exports = { pool }
const pool = db.pool || db;

// =============================
// CREAR PARTE VIRTUAL
// =============================
// FUNCIÓN PARA CREAR PARTE VIRTUAL (con hora_inicio / hora_fin y evidencia)
const crearParte = async (req, res) => {
  console.log("📥 Creando Parte Virtual...");
  console.log("👉 Body recibido en crearParte:", req.body);
  console.log("👉 Archivos recibidos:", (req.files && req.files.length) || 0);

  const client = await pool.connect();

  const {
    parte_fisico,
    fecha,
    hora,       // hora inicio
    hora_fin,   // hora fin (opcional, puede venir vacío)
    sector,
    zona,
    turno,
    lugar,
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
    usuario_id,
  } = req.body;

  try {
    await client.query("BEGIN");

    // 1. INSERTAR PARTE (obtenemos ID)
    const insertParteQuery = `
      INSERT INTO partes_virtuales (
        parte_fisico,
        fecha,
        hora,
        hora_fin,
        sector,
        zona,
        turno,
        lugar,
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
        usuario_id
      ) VALUES (
        $1,  $2,  $3,  $4,
        $5,  $6,  $7,  $8,
        $9,  $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19
      )
      RETURNING id;
    `;

    const valuesParte = [
      parte_fisico,
      fecha,
      hora || null, // hora inicio
      hora_fin && hora_fin.trim() !== "" ? hora_fin : null, // si viene vacío, va como NULL
      sector,
      zona,
      turno,
      lugar,
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
      usuario_id,
    ];

    const result = await client.query(insertParteQuery, valuesParte);
    const parteId = result.rows[0].id;

    console.log("✅ Parte insertado con id:", parteId);

    // 2. CARPETA FÍSICA: uploads/partes/<id>
    const carpetaParte = path.join(
      __dirname,
      "../../uploads/partes",
      String(parteId)
    );

    if (!fs.existsSync(carpetaParte)) {
      fs.mkdirSync(carpetaParte, { recursive: true });
    }

    // 3. MOVER ARCHIVOS + REGISTRAR EN parte_archivos
    if (req.files && req.files.length > 0) {
      console.log("📎 Recibidos", req.files.length, "archivos de evidencia");

      for (const file of req.files) {
        const oldPath = file.path; // ruta temporal
        const newPath = path.join(carpetaParte, file.filename);

        // Copiamos y luego borramos el temporal (para evitar EPERM en Windows)
        fs.copyFileSync(oldPath, newPath);
        fs.unlinkSync(oldPath);

        // ruta relativa que usará el frontend: /uploads/partes/<id>/<archivo>
        const rutaRelativa = path
          .join("partes", String(parteId), file.filename)
          .replace(/\\/g, "/");

        const tipo =
          file.mimetype && file.mimetype.startsWith("video")
            ? "video"
            : "foto";

        await client.query(
          `
          INSERT INTO parte_archivos (parte_id, tipo, ruta, nombre_original)
          VALUES ($1, $2, $3, $4)
        `,
          [parteId, tipo, rutaRelativa, file.originalname]
        );
      }
    } else {
      console.log("ℹ️ No se recibieron archivos de evidencia en req.files");
    }

    await client.query("COMMIT");

    return res.status(201).json({
      ok: true,
      message: "Parte registrado y archivos organizados",
      id: parteId,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ ERROR CRÍTICO AL CREAR PARTE (DB/FS):", error);

    return res.status(500).json({
      ok: false,
      message: "Fallo interno al crear el parte",
      details: error.message,
    });
  } finally {
    client.release();
  }
};

// =============================
// LISTAR PARTES (paginado, más nuevos primero)
// =============================
const listarPartes = async (req, res) => {
  console.log("📄 Listando partes virtuales...");
  const { usuario_id, page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query;
    let countQuery;
    let params = [];
    let countParams = [];

    if (usuario_id) {
      query = `
        SELECT *
        FROM partes_virtuales
        WHERE usuario_id = $1
        ORDER BY id DESC
        LIMIT $2 OFFSET $3;
      `;
      params = [usuario_id, limitNum, offset];

      countQuery = `
        SELECT COUNT(*) AS total
        FROM partes_virtuales
        WHERE usuario_id = $1;
      `;
      countParams = [usuario_id];
    } else {
      query = `
        SELECT *
        FROM partes_virtuales
        ORDER BY id DESC
        LIMIT $1 OFFSET $2;
      `;
      params = [limitNum, offset];

      countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales;`;
      countParams = [];
    }

    const result = await pool.query(query, params);
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].total);

    return res.json({
      ok: true,
      partes: result.rows,
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("❌ Error al listar partes:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al listar partes",
      error: error.message,
    });
  }
};

// =============================
// OBTENER DETALLE DE UN PARTE
// =============================
const obtenerParte = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Obteniendo parte id=${id}`);

  try {
    const parteQuery = `
      SELECT
        id,
        parte_fisico,
        fecha,
        hora,
        hora_fin,
        sector,
        zona,
        turno,
        lugar,
        unidad_tipo,
        unidad_numero,
        placa,
        conductor,
        dni_conductor,
        sumilla,
        asunto,
        ocurrencia,
        sup_zonal AS supervisor_zonal,
        sup_general AS supervisor_general,
        usuario_id
      FROM partes_virtuales
      WHERE id = $1;
    `;

    const parteResult = await pool.query(parteQuery, [id]);

    if (parteResult.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Parte no encontrado",
      });
    }

    const parte = parteResult.rows[0];
    const parteId = parte.id;

    const archivosQuery = `
      SELECT id, parte_id, tipo, ruta, nombre_original, creado_en
      FROM parte_archivos
      WHERE parte_id = $1;
    `;

    const archivosResult = await pool.query(archivosQuery, [parteId]);
    console.log(
      `📎 Archivos en BD para parte ${parteId}:`,
      archivosResult.rows
    );

    const archivos = archivosResult.rows || [];

    let fotos = archivos
      .filter((a) => {
        const t = (a.tipo || "").toLowerCase();
        return t.startsWith("foto") || t.startsWith("image") || t === "img";
      })
      .map((a) => a.ruta);

    let videos = archivos
      .filter((a) => {
        const t = (a.tipo || "").toLowerCase();
        return t.startsWith("video") || t.includes("mp4") || t.includes("avi");
      })
      .map((a) => a.ruta);

    if (archivos.length > 0 && fotos.length === 0 && videos.length === 0) {
      console.warn(
        `⚠️ Archivos sin tipo reconocido para parte ${parteId}, se envían todos como fotos`
      );
      fotos = archivos.map((a) => a.ruta);
    }

    parte.fotos = fotos;
    parte.videos = videos;

    console.log(
      `📸 Resumen multimedia parte ${parteId}: fotos=${fotos.length}, videos=${videos.length}`
    );

    return res.json({
      ok: true,
      parte,
      data: parte,
    });
  } catch (error) {
    console.error("❌ Error al obtener parte:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener parte",
      error: error.message,
    });
  }
};

// =============================
// ACTUALIZAR PARTE (texto, incluye hora/hora_fin)
// =============================
const actualizarParte = async (req, res) => {
  const { id } = req.params;

  const {
    parte_fisico,
    fecha,
    hora,
    hora_fin,
    sector,
    zona,
    turno,
    lugar,
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

  try {
    const result = await pool.query(
      `
      UPDATE partes_virtuales
      SET
        parte_fisico = $1,
        fecha        = $2,
        hora         = $3,
        hora_fin     = $4,
        sector       = $5,
        zona         = $6,
        turno        = $7,
        lugar        = $8,
        unidad_tipo  = $9,
        unidad_numero= $10,
        placa        = $11,
        conductor    = $12,
        dni_conductor= $13,
        sumilla      = $14,
        asunto       = $15,
        ocurrencia   = $16,
        sup_zonal    = $17,
        sup_general  = $18
      WHERE id = $19
      RETURNING *;
      `,
      [
        parte_fisico,
        fecha,
        hora,
        hora_fin || null,
        sector,
        zona,
        turno,
        lugar,
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
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Parte no encontrado para actualizar",
      });
    }

    return res.json({
      ok: true,
      message: "Parte actualizado correctamente",
      parte: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar parte:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al actualizar parte",
      error: error.message,
    });
  }
};

// =============================
// CERRAR PARTE (marca hora_fin = ahora)
// =============================
const cerrarParte = async (req, res) => {
  const { id } = req.params;
  const { hora_fin } = req.body || {};

  console.log(`🔒 Cerrando parte id=${id} con hora_fin=`, hora_fin);

  // Si viene una hora desde el front (ej: "14:30") la usamos
  // Si NO viene, usamos la hora actual del servidor
  const horaFinFinal =
    hora_fin && hora_fin.trim() !== "" ? hora_fin.trim() : null;

  try {
    let result;
    if (horaFinFinal) {
      result = await pool.query(
        `
        UPDATE partes_virtuales
        SET hora_fin = $2
        WHERE id = $1
        RETURNING *;
        `,
        [id, horaFinFinal]
      );
    } else {
      // fallback: si por alguna razón no mandan hora_fin
      result = await pool.query(
        `
        UPDATE partes_virtuales
        SET hora_fin = TO_CHAR(NOW(), 'HH24:MI')
        WHERE id = $1
        RETURNING *;
        `,
        [id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Parte no encontrado",
      });
    }

    console.log("✅ Parte cerrado correctamente:", result.rows[0]);

    return res.json({
      ok: true,
      message: "Parte cerrado correctamente",
      parte: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error interno al cerrar parte:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al cerrar parte",
      error: error.message,
    });
  }
};

module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
  cerrarParte,
};