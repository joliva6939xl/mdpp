// mdpp/api/src/controllers/callcenter.controller.js

let pool;
try {
  pool = require("../db");
} catch {
  pool = require("../config/db");
}

const ZONAS = ["norte", "centro", "sur"];

function initZonas() {
  return {
    norte: { total: 0, incidencias: [] },
    centro: { total: 0, incidencias: [] },
    sur: { total: 0, incidencias: [] },
  };
}

async function detectarColumnaIncidencia() {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='partes_virtuales'
      AND column_name IN ('sumilla','incidencia');
  `;
  const { rows } = await pool.query(q);
  const cols = rows.map((r) => r.column_name);
  if (cols.includes("sumilla")) return "sumilla";
  if (cols.includes("incidencia")) return "incidencia";
  return null;
}

async function obtenerConteoZonas(req, res) {
  try {
    const colInc = await detectarColumnaIncidencia();
    if (!colInc) {
      return res.status(500).json({
        ok: false,
        message:
          "La tabla partes_virtuales no tiene columna 'sumilla' ni 'incidencia'.",
      });
    }

    // 1) Conteo SOLO norte/centro/sur (normalizando)
    const sql = `
      SELECT
        LOWER(TRIM(zona)) AS zona_norm,
        TRIM(COALESCE(${colInc}, 'SIN INCIDENCIA')) AS incidencia,
        COUNT(*)::int AS total
      FROM partes_virtuales
      WHERE zona IS NOT NULL
        AND LOWER(TRIM(zona)) IN ('norte','centro','sur')
      GROUP BY 1,2
      ORDER BY 1, total DESC, incidencia ASC;
    `;

    const { rows } = await pool.query(sql);

    const zonas = initZonas();
    for (const r of rows) {
      const z = r.zona_norm;
      if (!zonas[z]) continue;
      zonas[z].incidencias.push({ incidencia: r.incidencia, total: r.total });
      zonas[z].total += r.total;
    }

    const total_general =
      (zonas.norte.total || 0) +
      (zonas.centro.total || 0) +
      (zonas.sur.total || 0);

    // 2) Debug REAL: cuántas NO son norte/centro/sur
    const debugSql = `
      SELECT
        COUNT(*)::int AS total_en_bd,
        SUM(
          CASE
            WHEN zona IS NULL THEN 1
            WHEN LOWER(TRIM(zona)) IN ('norte','centro','sur') THEN 0
            ELSE 1
          END
        )::int AS total_fuera
      FROM partes_virtuales;
    `;
    const dbg = await pool.query(debugSql);

    return res.json({
      ok: true,
      zonas,
      total_general, // ✅ SOLO norte/centro/sur
      debug: dbg.rows?.[0] || null,
    });
  } catch (error) {
    console.error("Error en obtenerConteoZonas:", error);
    return res.status(500).json({
      ok: false,
      message: "Error obteniendo conteo de zonas.",
    });
  }
}

module.exports = { obtenerConteoZonas };
