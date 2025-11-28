// api/src/controllers/partes.controller.js
const fs = require("fs").promises;
const path = require("path");

// Importamos la conexión a PostgreSQL
const db = require("../config/db");
const pool = db.pool || db;

/**
 * Crear un Parte Virtual con posibles archivos adjuntos (fotos / videos).
 * Usa:
 *  - Tabla partes_virtuales para todos los datos del parte
 *  - Tabla parte_archivos para los archivos
 */
const crearParte = async (req, res) => {
  console.log("📥 Creando Parte Virtual...");
  console.log("👉 Body recibido en crearParte:", req.body);

  // Datos que manda la app móvil
  const {
    parte_fisico,
    fecha,
    hora,
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
    usuario_id, // este es el nombre correcto en tu BD
  } = req.body;

  console.log("👉 Campos mapeados para INSERT en partes_virtuales:", {
    parte_fisico,
    fecha,
    hora,
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
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // NO usamos fecha_registro porque NO existe en tu tabla
    const insertParteQuery = `
      INSERT INTO partes_virtuales (
        parte_fisico,
        fecha,
        hora,
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
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $17, $18
      )
      RETURNING *;
    `;

    const parteResult = await client.query(insertParteQuery, [
      parte_fisico,
      fecha,
      hora,
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
    ]);

    const parte = parteResult.rows[0];

    // id principal de la tabla (asumimos que es "id")
    const idParte =
      parte.id ??
      parte.id_parte ??
      parte.idparte ??
      parte.parte_id;

    console.log("✅ Parte insertado, idParte detectado para archivos:", idParte);

    // --- LÓGICA PARA MOVER Y GUARDAR ARCHIVOS ---
    // 1. Definir el directorio de destino DENTRO de la carpeta /api/uploads
    const baseUploadDir = path.resolve(__dirname, '../../uploads');
    const parteDir = path.join(baseUploadDir, "partes", String(idParte));
    await fs.mkdir(parteDir, { recursive: true });

    const archivosGuardados = [];

    // 2. Mover archivos y guardar sus rutas finales en la BD
    if (req.files && req.files.length > 0) {
      console.log(`📎 Recibidos ${req.files.length} archivos de evidencia`);

      const insertArchivoQuery = `
        INSERT INTO parte_archivos (
          parte_id,
          tipo,
          ruta,
          nombre_original
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      for (const file of req.files) {
        // Mover el archivo de la carpeta temporal a la definitiva
        const tempPath = file.path;
        const newPath = path.join(parteDir, file.filename);
        await fs.rename(tempPath, newPath);

        // Guardar la ruta RELATIVA en la base de datos (ej: "partes/123/archivo.jpg")
        const relativePath = path.join("partes", String(idParte), file.filename);

        const tipoArchivo = file.mimetype.startsWith("image/") ? "foto" : "video";

        const archivoResult = await client.query(insertArchivoQuery, [
          idParte,
          tipoArchivo,
          relativePath, // Guardamos la ruta final y relativa
          file.originalname,
        ]);

        archivosGuardados.push(archivoResult.rows[0]);
      }
    } else {
      console.log("ℹ️ No se recibieron archivos de evidencia en req.files");
    }

    await client.query("COMMIT");

    return res.status(201).json({
      ok: true,
      message: "Parte virtual creado correctamente",
      parte,
      archivos: archivosGuardados,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear parte:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al crear parte",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * 🔹 LISTAR PARTES VIRTUALES (para el HISTORIAL)
 * - Si viene ?usuario_id=18 -> lista SOLO los partes de ese usuario
 * - Si no viene usuario_id -> lista todos
 */
const listarPartes = async (req, res) => {
  console.log("📄 Listando partes virtuales...");
  console.log("👉 Query recibida en listarPartes:", req.query);

  const { usuario_id } = req.query;

  try {
    let query;
    let params = [];

    if (usuario_id) {
      query = `
        SELECT *
        FROM partes_virtuales
        WHERE usuario_id = $1
        ORDER BY fecha DESC, hora DESC;
      `;
      params = [usuario_id];
    } else {
      query = `
        SELECT *
        FROM partes_virtuales
        ORDER BY fecha DESC, hora DESC;
      `;
    }

    const result = await pool.query(query, params);

    return res.json({
      ok: true,
      total: result.rowCount,
      data: result.rows,
      partes: result.rows,
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

/**
 * 🔹 OBTENER DETALLE DE UN PARTE + ARCHIVOS
 * Usamos:
 *  - columna "id" en partes_virtuales
 *  - columna "parte_id" en parte_archivos
 * Devolvemos sup_zonal y sup_general tal cual vienen de la BD.
 */
const obtenerParte = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Obteniendo parte id=${id}`);

  try {
    // 1) Traemos el parte
    const parteQuery = `
      SELECT
        id,
        parte_fisico,
        fecha,
        hora,
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

    // Parte tal cual viene de la BD (incluye sup_zonal y sup_general)
    const parte = parteResult.rows[0];

    const idParte =
      parte.id ??
      parte.id_parte ??
      parte.idparte ??
      parte.parte_id;

    // 2) Traemos los archivos del parte
    // SELECT * para no romper por nombres de columnas
    const archivosQuery = `
      SELECT *
      FROM parte_archivos
      WHERE parte_id = $1;
    `;

    const archivosResult = await pool.query(archivosQuery, [idParte]);

    // 3) Extraemos las rutas relativas de los archivos para fotos y videos
    const fotos = archivosResult.rows
      .filter((a) => a.tipo === "foto")
      .map((a) => a.ruta); // Ahora usamos la ruta completa guardada en la BD

    const videos = archivosResult.rows
      .filter((a) => a.tipo === "video")
      .map((a) => a.ruta); // Ahora usamos la ruta completa guardada en la BD

    // 4) Adjuntamos las listas de archivos al objeto del parte
    parte.fotos = fotos;
    parte.videos = videos;

    return res.json({
      ok: true,
      parte, // Ahora el objeto 'parte' contiene las listas de fotos y videos
      data: parte, // Mantenemos 'data' por consistencia con otras respuestas
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

/**
 * 🔹 ACTUALIZAR PARTE (solo campo "ocurrencia" por ahora)
 * Usamos SOLO la columna "id"
 */
const actualizarParte = async (req, res) => {
  const { id } = req.params;
  const { ocurrencia } = req.body;

  console.log(`✏️ Actualizando parte id=${id} con ocurrencia=${ocurrencia}`);

  if (!ocurrencia) {
    return res.status(400).json({
      ok: false,
      message: "ocurrencia es obligatoria para actualizar",
    });
  }

  try {
    const updateQuery = `
      UPDATE partes_virtuales
      SET ocurrencia = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [ocurrencia, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Parte no encontrado",
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

module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
};
