// mdpp/api/src/controllers/callcenter.controller.js
const db = require("../config/db");
const pool = db.pool || db;

/**
 * GET /api/callcenter/conteo
 * Agrupa por macro-zona (NORTE/CENTRO/SUR) usando "sector"
 * y por incidencia usando "sumilla".
 *
 * Devuelve:
 * {
 *   ok: true,
 *   total_general: number,
 *   zonas: {
 *     NORTE: { total: number, incidencias: [{ incidencia, total }] },
 *     CENTRO: { ... },
 *     SUR: { ... },
 *     OTROS: { ... } // si existiera algún sector fuera de 1/2/3
 *   },
 *   rows: [...] // opcional: filas crudas
 * }
 */
const obtenerConteo = async (req, res) => {
  try {
    const sql = `
      SELECT
        CASE
          WHEN TRIM(COALESCE(sumilla, '')) = '' THEN 'SIN INCIDENCIA'
          ELSE TRIM(sumilla)
        END AS incidencia,
        CASE
          WHEN sector::text = '1' THEN 'NORTE'
          WHEN sector::text = '2' THEN 'CENTRO'
          WHEN sector::text = '3' THEN 'SUR'
          ELSE 'OTROS'
        END AS zona_macro,
        COUNT(*)::int AS total
      FROM partes_virtuales
      GROUP BY zona_macro, incidencia
      ORDER BY zona_macro, total DESC, incidencia ASC;
    `;

    const { rows } = await pool.query(sql);

    const zonas = {};
    let totalGeneral = 0;

    for (const r of rows) {
      const zona = r.zona_macro || "OTROS";
      const incidencia = r.incidencia || "SIN INCIDENCIA";
      const total = Number(r.total || 0);

      totalGeneral += total;

      if (!zonas[zona]) {
        zonas[zona] = { total: 0, incidencias: [] };
      }

      zonas[zona].total += total;
      zonas[zona].incidencias.push({ incidencia, total });
    }

    return res.json({
      ok: true,
      total_general: totalGeneral,
      zonas,
      rows, // útil para debug/validación
    });
  } catch (error) {
    console.error("❌ Error en obtenerConteo (callcenter):", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al generar conteo de callcenter",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerConteo,
};
